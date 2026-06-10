"""
Core randomization engine for exam version generation.

Algorithm:
1. Load all valid questions per topic.
2. For each version:
   a. Shuffle the topic order.
   b. For each topic, randomly select questions_per_topic questions (without replacement within version).
   c. Shuffle the selected questions within each topic block.
   d. Shuffle the alternatives for each question.
   e. Assign letters A-E to shuffled alternatives.
   f. Record which letter maps to the is_correct alternative (snapshot).
3. Persist ExamVersion, ExamVersionQuestion, ExamVersionAlternative.

Correctness guarantee:
- is_correct_snapshot is determined AFTER shuffling, by finding the alternative whose
  original is_correct == True and recording the letter it received post-shuffle.
- No code assumes a specific letter for the correct answer.
"""
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.exam import Exam
from app.models.exam_config import ExamConfig
from app.models.exam_topic import ExamTopic
from app.models.question import Question
from app.models.alternative import Alternative
from app.models.exam_version import ExamVersion
from app.models.exam_version_question import ExamVersionQuestion
from app.models.exam_version_alternative import ExamVersionAlternative
from app.schemas.version import GenerateVersionsResponse, GeneratedVersionItem
from app.utils.exceptions import NotFoundError, ValidationError
from app.utils.file_names import version_code_from_index

LETTERS = ["A", "B", "C", "D", "E"]


async def _load_valid_questions(topic_id: int, db: AsyncSession) -> list[Question]:
    result = await db.execute(
        select(Question)
        .where(Question.topic_id == topic_id)
        .options(selectinload(Question.alternatives))
    )
    questions = result.scalars().all()
    return [
        q for q in questions
        if len(q.alternatives) == 5 and sum(1 for a in q.alternatives if a.is_correct) == 1
    ]


async def generate_versions(exam_id: int, seed: int | None, db: AsyncSession) -> GenerateVersionsResponse:
    # Load exam with config and topics
    result = await db.execute(
        select(Exam)
        .where(Exam.id == exam_id)
        .options(selectinload(Exam.config), selectinload(Exam.exam_topics))
    )
    exam = result.scalar_one_or_none()
    if not exam:
        raise NotFoundError("Exam", exam_id)
    if not exam.config:
        raise ValidationError("Exam has no configuration")

    config = exam.config
    exam_topics = exam.exam_topics

    if len(exam_topics) != config.total_topics:
        raise ValidationError(
            f"Exam has {len(exam_topics)} topics but config requires {config.total_topics}"
        )

    # Pre-load valid questions per topic
    topic_questions: dict[int, list[Question]] = {}
    for et in exam_topics:
        valid = await _load_valid_questions(et.topic_id, db)
        if len(valid) < et.questions_count:
            raise ValidationError(
                f"Topic id={et.topic_id} needs {et.questions_count} valid questions "
                f"but only has {len(valid)}"
            )
        topic_questions[et.topic_id] = valid

    rng = random.Random(seed)
    generated: list[GeneratedVersionItem] = []

    for version_idx in range(config.version_count):
        version_code = version_code_from_index(version_idx)

        version = ExamVersion(exam_id=exam_id, version_code=version_code)
        db.add(version)
        await db.flush()

        # Shuffle topic order
        topic_order = list(exam_topics)
        rng.shuffle(topic_order)

        global_order = 1  # 1-based question numbering across the exam

        for topic_pos, et in enumerate(topic_order, start=1):
            available = list(topic_questions[et.topic_id])
            selected = rng.sample(available, et.questions_count)
            rng.shuffle(selected)  # shuffle within topic block

            for q in selected:
                vq = ExamVersionQuestion(
                    exam_version_id=version.id,
                    question_id=q.id,
                    order_number=global_order,
                    topic_order=topic_pos,
                )
                db.add(vq)
                await db.flush()

                # Shuffle alternatives
                alts = list(q.alternatives)
                rng.shuffle(alts)

                for alt_idx, alt in enumerate(alts):
                    letter = LETTERS[alt_idx]
                    va = ExamVersionAlternative(
                        exam_version_question_id=vq.id,
                        alternative_id=alt.id,
                        letter=letter,
                        order_number=alt_idx + 1,
                        is_correct_snapshot=alt.is_correct,
                    )
                    db.add(va)

                global_order += 1

        await db.flush()
        generated.append(GeneratedVersionItem(id=version.id, version_code=version_code))

    return GenerateVersionsResponse(exam_id=exam_id, generated_versions=generated)
