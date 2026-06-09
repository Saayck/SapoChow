import enum


class GenerationStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PROCESANDO = "PROCESANDO"
    COMPLETADO = "COMPLETADO"
    FALLIDO = "FALLIDO"