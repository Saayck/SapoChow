import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.question import Question
from app.enums import QuestionStatus
from app.models.alternative import Alternative
from app.models.user import User
from app.repositories.question_repository import QuestionRepository
from app.repositories.alternative_repository import AlternativeRepository
from app.schemas.question_schema import QuestionCreate, QuestionUpdate, QuestionResponse

REQUIRED_ALTERNATIVES = 5


class QuestionService:
    def __init__(self, db: AsyncSession):
        self.repo = QuestionRepository(db)
        self.alt_repo = AlternativeRepository(db)

    async def get_all(self) -> List[QuestionResponse]:
        questions = await self.repo.get_all()
        return [QuestionResponse.model_validate(q) for q in questions]

    async def get_by_id(self, question_id: uuid.UUID) -> QuestionResponse:
        question = await self.repo.get_by_id(question_id)
        if not question:
            raise NotFoundException("Pregunta no encontrada")
        return QuestionResponse.model_validate(question)

    async def create(self, data: QuestionCreate, current_user: User) -> QuestionResponse:
        """
        Crea una pregunta con exactamente 5 alternativas y exactamente 1 correcta.
        Valida ambas restricciones antes de persistir nada.
        Las preguntas nuevas inician en estado BORRADOR.
        """
        self._validate_alternatives(data.alternatives)

        question = Question(
            id=uuid.uuid4(),
            topic_id=data.topic_id,
            statement=data.statement,
            latex_content=data.latex_content,
            image_url=data.image_url,
            points=data.points,
            created_by=current_user.id,
        )
        created = await self.repo.create(question)

        alternatives = [
            Alternative(
                id=uuid.uuid4(),
                question_id=created.id,
                content=alt.content,
                latex_content=alt.latex_content,
                image_url=alt.image_url,
                is_correct=alt.is_correct,
                default_order=idx,
            )
            for idx, alt in enumerate(data.alternatives)
        ]
        await self.alt_repo.create_bulk(alternatives)

        question = await self.repo.get_by_id(created.id)
        return QuestionResponse.model_validate(question)

    async def update(self, question_id: uuid.UUID, data: QuestionUpdate) -> QuestionResponse:
        """
        Actualiza campos de la pregunta. El status no se puede cambiar aquí;
        usar los endpoints approve/reject.
        """
        question = await self.repo.get_by_id(question_id)
        if not question:
            raise NotFoundException("Pregunta no encontrada")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(question, field, value)
        updated = await self.repo.update(question)
        return QuestionResponse.model_validate(updated)

    async def delete(self, question_id: uuid.UUID) -> None:
        question = await self.repo.get_by_id(question_id)
        if not question:
            raise NotFoundException("Pregunta no encontrada")
        await self.repo.soft_delete(question)

    async def approve(self, question_id: uuid.UUID) -> QuestionResponse:
        """
        Aprueba una pregunta. Solo permite aprobar desde BORRADOR o REVISADO.
        Re-valida las restricciones de alternativas como medida de seguridad.
        """
        question = await self.repo.get_by_id(question_id)
        if not question:
            raise NotFoundException("Pregunta no encontrada")
        if question.status == QuestionStatus.RECHAZADO:
            raise BadRequestException("No se puede aprobar una pregunta rechazada; cámbiala a BORRADOR primero")

        self._validate_alternatives(question.alternatives)

        question.status = QuestionStatus.APROBADO
        updated = await self.repo.update(question)
        return QuestionResponse.model_validate(updated)

    async def reject(self, question_id: uuid.UUID) -> QuestionResponse:
        """Rechaza una pregunta. Cualquier estado puede ser rechazado."""
        question = await self.repo.get_by_id(question_id)
        if not question:
            raise NotFoundException("Pregunta no encontrada")
        question.status = QuestionStatus.RECHAZADO
        updated = await self.repo.update(question)
        return QuestionResponse.model_validate(updated)

    def _validate_alternatives(self, alternatives) -> None:
        """
        Aplica las dos reglas duras sobre alternativas:
        - Exactamente 5 alternativas por pregunta.
        - Exactamente 1 marcada como correcta.
        """
        if len(alternatives) != REQUIRED_ALTERNATIVES:
            raise BadRequestException(
                f"Una pregunta debe tener exactamente {REQUIRED_ALTERNATIVES} alternativas, se recibieron {len(alternatives)}"
            )
        correct_count = sum(1 for a in alternatives if a.is_correct)
        if correct_count != 1:
            raise BadRequestException(
                f"Una pregunta debe tener exactamente 1 alternativa correcta, se recibieron {correct_count}"
            )