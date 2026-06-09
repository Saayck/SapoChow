import uuid
from typing import List, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.exam_version import ExamVersion
from app.enums import GenerationStatus
from app.models.question import Question
from app.models.user import User
from app.repositories.exam_repository import ExamRepository
from app.repositories.exam_version_repository import ExamVersionRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.version_schema import ExamVersionResponse, AnswerKeyResponse, GenerateVersionsRequest
from app.services.shuffle_service import ShuffleService
from app.utils import utcnow


class ExamVersionService:
    def __init__(self, db: AsyncSession):
        self.exam_repo = ExamRepository(db)
        self.version_repo = ExamVersionRepository(db)
        self.question_repo = QuestionRepository(db)
        self.shuffle_svc = ShuffleService()

    async def generate(
        self, exam_id: uuid.UUID, data: GenerateVersionsRequest, current_user: User
    ) -> List[ExamVersionResponse]:
        """
        Genera una o más versiones aleatorizadas del examen.

        Pasos:
        1. Carga el examen con su config y lista de temas.
        2. Por cada tema, obtiene solo preguntas APROBADO (BORRADOR/RECHAZADO quedan excluidas).
        3. Valida que cada tema tenga suficientes preguntas aprobadas.
        4. Por cada etiqueta de versión (Versión A, B, C...):
           a. Crea el registro ExamVersion.
           b. Usa ShuffleService para aleatorizar preguntas y alternativas.
              Con shuffle_questions=True, cada versión muestrea aleatoriamente del pool completo.
           c. Persiste ExamVersionQuestion y ExamVersionAlternative.
           d. Construye y almacena el answer_key JSON.
        """
        exam = await self.exam_repo.get_by_id(exam_id)
        if not exam:
            raise NotFoundException("Examen no encontrado")
        if not exam.config:
            raise BadRequestException("El examen no tiene configuración")

        count = data.count if data.count is not None else exam.config.versions_count

        # Construye los pools completos de preguntas para que cada versión muestree independientemente.
        topic_pools: Dict[uuid.UUID, Tuple[List[Question], int]] = {}
        for exam_topic in exam.topics:
            questions = await self.question_repo.get_approved_by_topic(exam_topic.topic_id)
            if len(questions) < exam_topic.questions_count:
                raise BadRequestException(
                    f"El tema {exam_topic.topic_id} necesita {exam_topic.questions_count} preguntas aprobadas "
                    f"pero solo hay {len(questions)} disponibles"
                )
            topic_pools[exam_topic.topic_id] = (questions, exam_topic.questions_count)

        labels = [f"Versión {chr(65 + i)}" for i in range(count)]
        result = []

        for label in labels:
            version = ExamVersion(
                id=uuid.uuid4(),
                exam_id=exam_id,
                version_label=label,
                generation_status=GenerationStatus.PROCESANDO,
                generated_by=current_user.id,
            )
            version = await self.version_repo.create(version)

            evqs, evas = self.shuffle_svc.build_version(
                version=version,
                topic_pools=topic_pools,
                shuffle_questions=exam.config.shuffle_questions,
                shuffle_alternatives=exam.config.shuffle_alternatives,
            )

            saved_evqs = await self.version_repo.create_questions(evqs)
            await self.version_repo.create_alternatives(evas)

            version.answer_key = self.shuffle_svc.build_answer_key(saved_evqs)
            version.generation_status = GenerationStatus.COMPLETADO
            version.generated_at = utcnow()
            version = await self.version_repo.update(version)

            result.append(ExamVersionResponse.model_validate(version))

        return result

    async def get_by_exam(self, exam_id: uuid.UUID) -> List[ExamVersionResponse]:
        versions = await self.version_repo.get_by_exam(exam_id)
        return [ExamVersionResponse.model_validate(v) for v in versions]

    async def get_by_id(self, version_id: uuid.UUID) -> ExamVersionResponse:
        version = await self.version_repo.get_by_id(version_id)
        if not version:
            raise NotFoundException("Versión no encontrada")
        return ExamVersionResponse.model_validate(version)

    async def get_answer_key(self, version_id: uuid.UUID) -> AnswerKeyResponse:
        """Retorna el answer_key JSON almacenado para una versión completada."""
        version = await self.version_repo.get_by_id(version_id)
        if not version:
            raise NotFoundException("Versión no encontrada")
        if version.generation_status != GenerationStatus.COMPLETADO:
            raise BadRequestException("La generación de la versión aún no ha sido completada")
        return AnswerKeyResponse(
            version_id=version.id,
            version_label=version.version_label,
            answer_key=version.answer_key or {},
        )