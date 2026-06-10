import io
import json
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.exam import Exam
from app.models.exam_version import ExamVersion
from app.models.exam_version_question import ExamVersionQuestion
from app.models.exam_version_alternative import ExamVersionAlternative
from app.models.question import Question
from app.models.alternative import Alternative
from app.schemas.version import (
    GenerateVersionsRequest,
    GenerateVersionsResponse,
    ExamVersionResponse,
    VersionPreviewResponse,
    VersionPreviewQuestion,
    VersionPreviewAlternative,
    AnswerKeyResponse,
    AnswerKeyItem,
)
from app.services.shuffle_service import generate_versions
from app.services.latex_service import generate_pdf
from app.utils.exceptions import NotFoundError, ServiceError
from app.utils.security import get_current_user

router = APIRouter(tags=["Versions"])


@router.post("/exams/{exam_id}/versions", response_model=GenerateVersionsResponse, status_code=201)
async def generate_exam_versions(
    exam_id: int,
    data: GenerateVersionsRequest,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    return await generate_versions(exam_id, data.seed, db)


@router.get("/exams/{exam_id}/versions", response_model=list[ExamVersionResponse])
async def list_exam_versions(exam_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExamVersion)
        .where(ExamVersion.exam_id == exam_id)
        .order_by(ExamVersion.version_code)
    )
    return list(result.scalars().all())


async def _build_preview(version_id: int, db: AsyncSession) -> VersionPreviewResponse:
    result = await db.execute(
        select(ExamVersion)
        .where(ExamVersion.id == version_id)
        .options(selectinload(ExamVersion.exam))
    )
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundError("ExamVersion", version_id)

    vq_result = await db.execute(
        select(ExamVersionQuestion)
        .where(ExamVersionQuestion.exam_version_id == version_id)
        .options(
            selectinload(ExamVersionQuestion.question),
            selectinload(ExamVersionQuestion.version_alternatives).selectinload(
                ExamVersionAlternative.alternative
            ),
        )
        .order_by(ExamVersionQuestion.order_number)
    )
    vqs = vq_result.scalars().all()

    questions_out = []
    for vq in vqs:
        alts_out = []
        for va in sorted(vq.version_alternatives, key=lambda x: x.order_number):
            alt = va.alternative
            alts_out.append(
                VersionPreviewAlternative(
                    letter=va.letter,
                    content_text=alt.content_text,
                    content_latex=alt.content_latex,
                    image_path=alt.image_path,
                    is_correct=va.is_correct_snapshot,
                )
            )
        q = vq.question
        questions_out.append(
            VersionPreviewQuestion(
                number=vq.order_number,
                statement_text=q.statement_text,
                statement_latex=q.statement_latex,
                image_path=q.image_path,
                topic_order=vq.topic_order,
                alternatives=alts_out,
            )
        )

    exam = version.exam
    return VersionPreviewResponse(
        version_id=version.id,
        version_code=version.version_code,
        exam={
            "title": exam.title,
            "institution_name": exam.institution_name,
            "teacher_name": exam.teacher_name,
            "exam_date": str(exam.exam_date),
            "instructions": exam.instructions,
        },
        questions=questions_out,
    )


@router.get("/versions/{version_id}/preview", response_model=VersionPreviewResponse)
async def get_version_preview(version_id: int, db: AsyncSession = Depends(get_db)):
    return await _build_preview(version_id, db)


@router.get("/versions/{version_id}/answer-key", response_model=AnswerKeyResponse)
async def get_answer_key(version_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExamVersion).where(ExamVersion.id == version_id))
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundError("ExamVersion", version_id)

    vq_result = await db.execute(
        select(ExamVersionQuestion)
        .where(ExamVersionQuestion.exam_version_id == version_id)
        .options(selectinload(ExamVersionQuestion.version_alternatives))
        .order_by(ExamVersionQuestion.order_number)
    )
    vqs = vq_result.scalars().all()

    answers = []
    for vq in vqs:
        correct_letter = next(
            (va.letter for va in vq.version_alternatives if va.is_correct_snapshot), "?"
        )
        answers.append(AnswerKeyItem(question_number=vq.order_number, correct_letter=correct_letter))

    return AnswerKeyResponse(version_code=version.version_code, answers=answers)


@router.get("/versions/{version_id}/pdf")
async def download_version_pdf(version_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ExamVersion).where(ExamVersion.id == version_id))
    version = result.scalar_one_or_none()
    if not version:
        raise NotFoundError("ExamVersion", version_id)

    if version.pdf_path and Path(version.pdf_path).exists():
        pdf_path = Path(version.pdf_path)
    else:
        pdf_path = await generate_pdf(version_id, db)

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
    )


@router.get("/exams/{exam_id}/export-all")
async def export_all_versions(exam_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Exam).where(Exam.id == exam_id))
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam", exam_id)

    versions_result = await db.execute(
        select(ExamVersion).where(ExamVersion.exam_id == exam_id).order_by(ExamVersion.version_code)
    )
    versions = versions_result.scalars().all()

    if not versions:
        raise ServiceError("No versions found for this exam. Generate versions first.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for version in versions:
            # Generate PDF if needed
            if version.pdf_path and Path(version.pdf_path).exists():
                pdf_path = Path(version.pdf_path)
            else:
                try:
                    pdf_path = await generate_pdf(version.id, db)
                except ServiceError as e:
                    # If PDF generation fails (e.g. Tectonic missing), write error note
                    zf.writestr(
                        f"version_{version.version_code}_pdf_error.txt",
                        f"PDF generation failed: {e.detail}",
                    )
                    pdf_path = None

            if pdf_path:
                zf.write(str(pdf_path), f"version_{version.version_code}.pdf")

            # Build answer key
            vq_result = await db.execute(
                select(ExamVersionQuestion)
                .where(ExamVersionQuestion.exam_version_id == version.id)
                .options(selectinload(ExamVersionQuestion.version_alternatives))
                .order_by(ExamVersionQuestion.order_number)
            )
            vqs = vq_result.scalars().all()
            answers = []
            for vq in vqs:
                correct_letter = next(
                    (va.letter for va in vq.version_alternatives if va.is_correct_snapshot), "?"
                )
                answers.append({"question_number": vq.order_number, "correct_letter": correct_letter})

            key_data = {"version_code": version.version_code, "answers": answers}
            zf.writestr(
                f"version_{version.version_code}_answer_key.json",
                json.dumps(key_data, indent=2, ensure_ascii=False),
            )

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}_export.zip"},
    )
