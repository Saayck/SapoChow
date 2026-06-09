import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.enums import ImportStatus


class ImportJobResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    status: ImportStatus
    total_detected: Optional[int]
    total_imported: Optional[int]
    error_message: Optional[str]
    created_at: datetime
    finished_at: Optional[datetime]

    model_config = {"from_attributes": True}
