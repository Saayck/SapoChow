import uuid
import re
from pathlib import Path


def safe_filename(original: str, suffix: str | None = None) -> str:
    stem = Path(original).stem
    stem = re.sub(r"[^\w\-]", "_", stem)[:50]
    unique_id = uuid.uuid4().hex[:8]
    ext = suffix or Path(original).suffix
    return f"{stem}_{unique_id}{ext}"


def version_code_from_index(index: int) -> str:
    """Convert 0-based index to version code: 0→A, 1→B, …, 25→Z, 26→AA, …"""
    letters = []
    n = index
    while True:
        letters.append(chr(ord("A") + (n % 26)))
        n = n // 26 - 1
        if n < 0:
            break
    return "".join(reversed(letters))
