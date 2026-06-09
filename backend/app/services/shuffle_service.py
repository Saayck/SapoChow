import random
import uuid
from typing import List, Dict, Tuple
from app.models.question import Question
from app.models.exam_version import ExamVersion
from app.models.exam_version_question import ExamVersionQuestion
from app.models.exam_version_alternative import ExamVersionAlternative

LETTERS = ["A", "B", "C", "D", "E"]


class ShuffleService:
    """
    Maneja la lógica de aleatorización para la generación de versiones de examen.
    Es responsable de seleccionar y mezclar preguntas y alternativas de forma independiente,
    y luego recalcular la letra correcta basándose en el nuevo orden.
    """

    def build_version(
        self,
        version: ExamVersion,
        topic_pools: Dict[uuid.UUID, Tuple[List[Question], int]],
        shuffle_questions: bool,
        shuffle_alternatives: bool,
    ) -> Tuple[List[ExamVersionQuestion], List[ExamVersionAlternative]]:
        """
        Construye las listas de preguntas y alternativas para una versión del examen.

        topic_pools maps topic_id -> (full_approved_pool, questions_count_needed).

        Por cada bloque de tema:
        1. shuffle_questions=True  → muestrea aleatoriamente `count` preguntas del pool
           shuffle_questions=False → toma los primeros `count` en orden por defecto
        2. Para cada pregunta, opcionalmente mezcla sus alternativas.
        3. Asigna letras A-E a las alternativas en su nuevo orden.
        4. Registra la correct_letter como la letra asignada a la alternativa con is_correct=True.

        Retorna dos listas listas para insertar en la BD.
        """
        evqs: List[ExamVersionQuestion] = []
        evas: List[ExamVersionAlternative] = []
        global_position = 1

        for block_num, (topic_id, (pool, count)) in enumerate(topic_pools.items(), start=1):
            if shuffle_questions:
                ordered = random.sample(pool, count)
            else:
                ordered = list(pool)[:count]

            for question in ordered:
                alternatives = list(question.alternatives)
                if shuffle_alternatives:
                    random.shuffle(alternatives)

                correct_letter = "A"
                evq_id = uuid.uuid4()
                alt_entries: List[ExamVersionAlternative] = []

                for pos, alt in enumerate(alternatives):
                    letter = LETTERS[pos]
                    if alt.is_correct:
                        correct_letter = letter
                    alt_entries.append(
                        ExamVersionAlternative(
                            id=uuid.uuid4(),
                            evq_id=evq_id,
                            alternative_id=alt.id,
                            assigned_letter=letter,
                            position=pos + 1,
                        )
                    )

                evqs.append(
                    ExamVersionQuestion(
                        id=evq_id,
                        exam_version_id=version.id,
                        question_id=question.id,
                        position=global_position,
                        topic_block=block_num,
                        correct_letter=correct_letter,
                    )
                )
                evas.extend(alt_entries)
                global_position += 1

        return evqs, evas

    def build_answer_key(self, evqs: List[ExamVersionQuestion]) -> Dict[str, str]:
        """
        Construye el JSON de la clave de respuestas desde las preguntas de la versión.
        Mapea la posición de la pregunta (como string) a su letra correcta.
        Ejemplo: {"1": "C", "2": "A", "3": "E", ...}
        """
        return {str(evq.position): evq.correct_letter for evq in evqs}
