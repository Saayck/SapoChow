import enum


class ImportStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PROCESANDO = "PROCESANDO"
    COMPLETADO = "COMPLETADO"
    FALLIDO = "FALLIDO"