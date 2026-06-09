import enum


class PDFLogStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    EXITOSO = "EXITOSO"
    FALLIDO = "FALLIDO"