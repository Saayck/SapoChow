import enum


class QuestionStatus(str, enum.Enum):
    BORRADOR = "BORRADOR"
    REVISADO = "REVISADO"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"