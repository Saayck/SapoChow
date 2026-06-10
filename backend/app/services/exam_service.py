from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.exam import Exam
from app.models.exam_config import ExamConfig
from app.models.exam_topic import ExamTopic
from app.models.topic import Topic
from app.models.question import Question
from app.models.alternative import Alternative
from app.schemas.exam import ExamCreate, ExamUpdate
from app.utils.exceptions import NotFoundError, ValidationError


async def _validate_exam_topics(topics_data, config_data, db: AsyncSession):
    for topic_in in topics_data:
        result = await db.execute(select(Topic).where(Topic.id == topic_in.topic_id))
        topic = result.scalar_one_or_none()
        if not topic:
            raise NotFoundError("Topic", topic_in.topic_id)

        # Count valid questions (with 5 alternatives and exactly one correct)
        q_result = await db.execute(
            select(Question).where(Question.topic_id == topic_in.topic_id)
            .options(selectinload(Question.alternatives))
        )
        questions = q_result.scalars().all()

        valid_questions = [
            q for q in questions
            if len(q.alternatives) == 5 and sum(1 for a in q.alternatives if a.is_correct) == 1
        ]

        if len(valid_questions) < topic_in.questions_count:
            raise ValidationError(
                f"Topic '{topic.name}' (id={topic.id}) needs {topic_in.questions_count} valid questions "
                f"but only has {len(valid_questions)} (questions with exactly 5 alternatives and 1 correct answer)"
            )


async def create_exam(data: ExamCreate, db: AsyncSession) -> Exam:
    await _validate_exam_topics(data.topics, data.config, db)

    exam = Exam(
        title=data.title,
        institution_name=data.institution_name,
        teacher_name=data.teacher_name,
        exam_date=data.exam_date,
        instructions=data.instructions,
    )
    db.add(exam)
    await db.flush()

    config = ExamConfig(
        exam_id=exam.id,
        total_questions=data.config.total_questions,
        total_topics=data.config.total_topics,
        questions_per_topic=data.config.questions_per_topic,
        version_count=data.config.version_count,
    )
    db.add(config)

    for topic_in in data.topics:
        exam_topic = ExamTopic(
            exam_id=exam.id,
            topic_id=topic_in.topic_id,
            questions_count=topic_in.questions_count,
        )
        db.add(exam_topic)

    await db.flush()
    await db.refresh(exam)
    return exam


async def get_exam(exam_id: int, db: AsyncSession) -> Exam:
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id)
        .options(selectinload(Exam.config), selectinload(Exam.exam_topics))
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam", exam_id)
    return exam


async def list_exams(db: AsyncSession) -> list[Exam]:
    result = await db.execute(
        select(Exam).options(selectinload(Exam.config), selectinload(Exam.exam_topics))
        .order_by(Exam.created_at.desc())
    )
    return list(result.scalars().all())


async def update_exam(exam_id: int, data: ExamUpdate, db: AsyncSession) -> Exam:
    exam = await get_exam(exam_id, db)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(exam, field, value)
    await db.flush()
    await db.refresh(exam)
    return exam


async def delete_exam(exam_id: int, db: AsyncSession) -> None:
    exam = await get_exam(exam_id, db)
    await db.delete(exam)
    await db.flush()
