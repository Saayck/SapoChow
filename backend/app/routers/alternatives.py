from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.alternative import Alternative
from app.schemas.alternative import AlternativeResponse
from app.services.file_service import save_upload_file
from app.utils.exceptions import NotFoundError
from app.utils.security import get_current_user

router = APIRouter(prefix="/alternatives", tags=["Alternatives"])


@router.post("/{alternative_id}/image", response_model=AlternativeResponse)
async def upload_alternative_image(
    alternative_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Alternative).where(Alternative.id == alternative_id))
    alternative = result.scalar_one_or_none()
    if not alternative:
        raise NotFoundError("Alternative", alternative_id)

    image_path = await save_upload_file(file, subfolder="alternatives")
    alternative.image_path = image_path
    await db.flush()
    await db.refresh(alternative)
    return alternative
