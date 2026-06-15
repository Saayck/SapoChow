from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.exam import Exam
from app.models.exam_config import ExamConfig
from app.models.exam_topic import ExamTopic
from app.models.topic import Topic
from app.models.question import Question
from app.models.alternative import Alternative
from app.schemas.exam import ExamCreate, ExamUpdate, ExamConfigUpdate, ExamTopicsUpdate
from app.utils.exceptions import NotFoundError, ValidationError


async def _validate_exam_topics(topics_data, config_data, db: AsyncSession):  # config_data unused, kept for call-site compatibility
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


async def list_exams(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Exam]:
    result = await db.execute(
        select(Exam).options(selectinload(Exam.config), selectinload(Exam.exam_topics))
        .order_by(Exam.created_at.desc())
        .offset(skip)
        .limit(limit)
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


async def update_exam_config(exam_id: int, data: ExamConfigUpdate, db: AsyncSession) -> Exam:
    exam = await get_exam(exam_id, db)
    if not exam.config:
        raise NotFoundError("ExamConfig for exam", exam_id)

    config = exam.config
    config.total_questions = data.total_questions
    config.total_topics = data.total_topics
    config.questions_per_topic = data.questions_per_topic
    config.version_count = data.version_count
    await db.flush()
    return await get_exam(exam_id, db)


async def update_exam_topics(exam_id: int, data: ExamTopicsUpdate, db: AsyncSession) -> Exam:
    exam = await get_exam(exam_id, db)

    if exam.config and len(data.topics) != exam.config.total_topics:
        raise ValidationError(
            f"Number of topics ({len(data.topics)}) must match total_topics in config ({exam.config.total_topics}). "
            "Update the exam config first if you need a different number of topics."
        )

    if exam.config:
        for t in data.topics:
            if t.questions_count != exam.config.questions_per_topic:
                raise ValidationError(
                    f"Each topic must contribute exactly {exam.config.questions_per_topic} questions "
                    f"(questions_per_topic in config), but topic_id={t.topic_id} has {t.questions_count}"
                )

    await _validate_exam_topics(data.topics, None, db)

    for old_et in list(exam.exam_topics):
        await db.delete(old_et)
    await db.flush()

    for topic_in in data.topics:
        db.add(ExamTopic(
            exam_id=exam_id,
            topic_id=topic_in.topic_id,
            questions_count=topic_in.questions_count,
        ))
    await db.flush()
    return await get_exam(exam_id, db)
