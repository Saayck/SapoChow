import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.question import Question
from app.models.alternative import Alternative
from app.models.topic import Topic
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionImportPreview, QuestionImportConfirm
from app.services.file_service import save_upload_file
from app.services.import_service import import_questions_from_file
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.security import get_current_user

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("", response_model=list[QuestionResponse])
async def list_questions(
    topic_id: int | None = Query(None),
    search: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    query = select(Question).options(selectinload(Question.alternatives)).order_by(Question.created_at.desc())
    if topic_id is not None:
        query = query.where(Question.topic_id == topic_id)
    if search:
        query = query.where(Question.statement_text.ilike(f"%{search}%"))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=QuestionResponse, status_code=201)
async def create_question(
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    # Verify topic exists
    result = await db.execute(select(Topic).where(Topic.id == data.topic_id))
    if not result.scalar_one_or_none():
        raise NotFoundError("Topic", data.topic_id)

    question = Question(
        topic_id=data.topic_id,
        statement_text=data.statement_text,
        statement_latex=data.statement_latex,
        image_path=data.image_path,
    )
    db.add(question)
    await db.flush()

    for alt_data in data.alternatives:
        alt = Alternative(
            question_id=question.id,
            content_text=alt_data.content_text,
            content_latex=alt_data.content_latex,
            image_path=alt_data.image_path,
            is_correct=alt_data.is_correct,
        )
        db.add(alt)

    await db.flush()

    result = await db.execute(
        select(Question).where(Question.id == question.id).options(selectinload(Question.alternatives))
    )
    return result.scalar_one()


@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(question_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.alternatives))
    )
    q = result.scalar_one_or_none()
    if not q:
        raise NotFoundError("Question", question_id)
    return q


@router.put("/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.alternatives))
    )
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question", question_id)

    if data.topic_id is not None:
        topic_result = await db.execute(select(Topic).where(Topic.id == data.topic_id))
        if not topic_result.scalar_one_or_none():
            raise NotFoundError("Topic", data.topic_id)
        question.topic_id = data.topic_id

    if data.statement_text is not None:
        question.statement_text = data.statement_text
    if data.statement_latex is not None:
        question.statement_latex = data.statement_latex
    if data.image_path is not None:
        question.image_path = data.image_path

    if data.alternatives is not None:
        for old_alt in question.alternatives:
            await db.delete(old_alt)
        await db.flush()
        for alt_data in data.alternatives:
            alt = Alternative(
                question_id=question.id,
                content_text=alt_data.content_text,
                content_latex=alt_data.content_latex,
                image_path=alt_data.image_path,
                is_correct=alt_data.is_correct,
            )
            db.add(alt)

    await db.flush()
    result = await db.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.alternatives))
    )
    return result.scalar_one()


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question", question_id)
    await db.delete(question)


@router.post("/import/confirm", response_model=list[QuestionResponse], status_code=201)
async def confirm_import(
    data: QuestionImportConfirm,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    topic_result = await db.execute(select(Topic).where(Topic.id == data.topic_id))
    if not topic_result.scalar_one_or_none():
        raise NotFoundError("Topic", data.topic_id)

    if not data.questions:
        raise ValidationError("No questions provided to save")

    created = []
    for i, q_data in enumerate(data.questions, start=1):
        if not q_data.statement_text and not q_data.statement_latex:
            raise ValidationError(f"Question {i} must have a statement")
        if len(q_data.alternatives) != 5:
            raise ValidationError(
                f"Question {i} must have exactly 5 alternatives, got {len(q_data.alternatives)}"
            )
        correct_count = sum(1 for a in q_data.alternatives if a.is_correct)
        if correct_count != 1:
            raise ValidationError(
                f"Question {i} must have exactly 1 correct alternative, got {correct_count}"
            )

        question = Question(
            topic_id=data.topic_id,
            statement_text=q_data.statement_text,
            statement_latex=q_data.statement_latex,
        )
        db.add(question)
        await db.flush()

        for alt_data in q_data.alternatives:
            if not alt_data.content_text and not alt_data.content_latex:
                raise ValidationError(f"An alternative in question {i} has no content")
            db.add(Alternative(
                question_id=question.id,
                content_text=alt_data.content_text,
                content_latex=alt_data.content_latex,
                is_correct=alt_data.is_correct,
            ))

        await db.flush()
        q_result = await db.execute(
            select(Question).where(Question.id == question.id)
            .options(selectinload(Question.alternatives))
        )
        created.append(q_result.scalar_one())

    return created


@router.post("/import", response_model=QuestionImportPreview)
async def import_questions(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()
    if ext not in (".docx", ".pdf"):
        raise ValidationError("Only .docx and .pdf files are supported for import")

    contents = await file.read()
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        preview = await import_questions_from_file(tmp_path, filename)
    finally:
        tmp_path.unlink(missing_ok=True)

    return preview


@router.post("/{question_id}/image", response_model=QuestionResponse)
async def upload_question_image(
    question_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(Question).where(Question.id == question_id).options(selectinload(Question.alternatives))
    )
    question = result.scalar_one_or_none()
    if not question:
        raise NotFoundError("Question", question_id)

    image_path = await save_upload_file(file, subfolder="questions")
    question.image_path = image_path
    await db.flush()
    await db.refresh(question)
    return question
