import uuid
from app.core.exceptions import BadRequestException


def parse_uuid(value: str) -> uuid.UUID:
    """Parsea un string UUID, lanzando BadRequestException si es inválido."""
    try:
        return uuid.UUID(value)
    except ValueError:
        raise BadRequestException(f"UUID inválido: {value}")