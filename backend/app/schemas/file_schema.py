import uuid
from datetime import datetime
from pydantic import BaseModel


class FileResponse(BaseModel):
    id: uuid.UUID
    original_name: str
    stored_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}
