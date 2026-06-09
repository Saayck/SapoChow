from typing import Any, Optional
from pydantic import BaseModel


class APIResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


def success_response(data: Any = None, message: str = "OK") -> dict:
    return {"success": True, "message": message, "data": data}


def error_response(message: str) -> dict:
    return {"success": False, "message": message, "data": None}