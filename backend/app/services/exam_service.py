import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.exam import Exam
from app.models.exam_config import ExamConfig
from app.models.exam_topic import ExamTopic
from app.models.user import User
from app.repositories.exam_repository import ExamRepository
from app.repositories.topic_repository import TopicRepository
from app.schemas.exam_schema import ExamCreate, ExamUpdate, ExamResponse


class ExamService:
    def __init__(self, db: AsyncSession):
        self.repo = ExamRepository(db)
        self.topic_repo = TopicRepository(db)

    async def get_all(self) -> List[ExamResponse]:
        exams = await self.repo.get_all()
        return [ExamResponse.model_validate(e) for e in exams]

    async def get_by_id(self, exam_id: uuid.UUID) -> ExamResponse:
        exam = await self.repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException("Exam not found")
        return ExamResponse.model_validate(exam)

    async def create(self, data: ExamCreate, current_user: User) -> ExamResponse:
        """
        Crea un examen con su configuración y asignación de temas.
        Valida:
        - Que total_topics coincida con la cantidad de temas en la lista.
        - Que la suma de questions_count de todos los temas sea igual a total_questions.
        - Que cada tema referenciado exista en la base de datos.
        """
        await self._validate_config(data)

        exam = Exam(
            id=uuid.uuid4(),
            title=data.title,
            institution_name=data.institution_name,
            institution_logo_url=data.institution_logo_url,
            course_name=data.course_name,
            professor_name=data.professor_name,
            instructions=data.instructions,
            duration_minutes=data.duration_minutes,
            header_latex=data.header_latex,
            created_by=current_user.id,
        )
        created = await self.repo.create(exam)

        config = ExamConfig(id=uuid.uuid4(), exam_id=created.id, **data.config.model_dump())
        await self.repo.create_config(config)

        exam_topics = [
            ExamTopic(
                id=uuid.uuid4(),
                exam_id=created.id,
                topic_id=t.topic_id,
                questions_count=t.questions_count,
                display_order=t.display_order,
            )
            for t in data.topics
        ]
        await self.repo.create_topics(exam_topics)

        exam = await self.repo.get_by_id(created.id)
        return ExamResponse.model_validate(exam)

    async def update(self, exam_id: uuid.UUID, data: ExamUpdate) -> ExamResponse:
        exam = await self.repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException("Exam not found")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(exam, field, value)
        updated = await self.repo.update(exam)
        return ExamResponse.model_validate(updated)

    async def delete(self, exam_id: uuid.UUID) -> None:
        exam = await self.repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException("Exam not found")
        await self.repo.soft_delete(exam)

    async def _validate_config(self, data: ExamCreate) -> None:
        """
        Valida coherencia interna de la configuración del examen:
        - El número de temas en la lista debe coincidir con total_topics.
        - La suma de questions_count por tema debe coincidir con total_questions.
        - Cada topic_id referenciado debe existir y estar activo.
        """
        cfg = data.config
        topics = data.topics

        if len(topics) != cfg.total_topics:
            raise BadRequestException(
                f"Expected {cfg.total_topics} topics but got {len(topics)}"
            )

        total = sum(t.questions_count for t in topics)
        if total != cfg.total_questions:
            raise BadRequestException(
                f"Sum of questions_count ({total}) must equal total_questions ({cfg.total_questions})"
            )

        for t in topics:
            topic = await self.topic_repo.get_by_id(t.topic_id)
            if not topic:
                raise NotFoundException(f"Topic {t.topic_id} not found")
