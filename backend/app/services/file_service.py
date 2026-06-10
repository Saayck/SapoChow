import io
from pathlib import Path

import aiofiles
import filetype
from fastapi import UploadFile
from PIL import Image

from app.config import settings
from app.utils.exceptions import ValidationError
from app.utils.file_names import safe_filename

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

_MIME_TO_EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
_MIME_TO_PIL = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}


def detect_mime(data: bytes) -> str | None:
    """Detect MIME type from raw bytes using the filetype library (magic-byte based, no DLLs)."""
    kind = filetype.guess(data)
    if kind is None:
        return None
    return kind.mime


async def save_upload_file(file: UploadFile, subfolder: str = "images") -> str:
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    contents = await file.read()
    if len(contents) > max_bytes:
        raise ValidationError(f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    # Real MIME detection from bytes — not from the client-supplied Content-Type header
    real_mime = detect_mime(contents)
    if real_mime is None or real_mime not in ALLOWED_MIME_TYPES:
        raise ValidationError(
            f"Invalid file type '{real_mime or 'unknown'}'. "
            "Only JPEG, PNG, and WebP images are allowed."
        )

    # Cross-check the declared extension (if provided) against the real MIME
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                f"Invalid file extension '{ext}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
    else:
        ext = _MIME_TO_EXT[real_mime]

    # Deep validation with Pillow — catches truncated / malformed images
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise ValidationError("File content is not a valid image")

    # Re-open after verify() (it closes the stream internally)
    img = Image.open(io.BytesIO(contents))
    if real_mime == "image/jpeg" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = io.BytesIO()
    img.save(output, format=_MIME_TO_PIL[real_mime], quality=85)
    processed_bytes = output.getvalue()

    dest_dir = Path(settings.UPLOAD_DIR) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    filename = safe_filename(file.filename or f"image{ext}", ext)
    dest_path = dest_dir / filename
    while dest_path.exists():
        filename = safe_filename(file.filename or f"image{ext}", ext)
        dest_path = dest_dir / filename

    async with aiofiles.open(dest_path, "wb") as f:
        await f.write(processed_bytes)

    return str(dest_path.relative_to(Path(settings.UPLOAD_DIR).parent)).replace("\\", "/")
