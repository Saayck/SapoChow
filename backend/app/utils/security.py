"""
Security utilities: password hashing (bcrypt) and JWT handling (python-jose).

NOTE: passlib is intentionally NOT used here. passlib's bcrypt handler is
incompatible with bcrypt >= 4.0 (changed C-extension API). Using bcrypt
directly is simpler, faster, and fully supported on Python 3.11+.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.utils.exceptions import UnauthorizedError

bearer_scheme = HTTPBearer()

_ENCODING = "utf-8"


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password* with a freshly generated salt."""
    return bcrypt.hashpw(password.encode(_ENCODING), bcrypt.gensalt()).decode(_ENCODING)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored *hashed* password."""
    try:
        return bcrypt.checkpw(plain.encode(_ENCODING), hashed.encode(_ENCODING))
    except (ValueError, TypeError):
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────

def _build_token(subject: Any, token_type: str, expire: datetime) -> str:
    payload = {"sub": str(subject), "exp": expire, "type": token_type}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_token(subject, "access", expire)


def create_refresh_token(subject: Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token(subject, "refresh", expire)


def decode_token(token: str, token_type: str = "access") -> str:
    """Decode and validate a JWT. Returns the subject (user id as string)."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise UnauthorizedError("Could not validate credentials")

    if payload.get("type") != token_type:
        raise UnauthorizedError(f"Expected token type '{token_type}'")

    subject: str | None = payload.get("sub")
    if not subject:
        raise UnauthorizedError("Token is missing subject claim")

    return subject


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import User

    user_id = decode_token(credentials.credentials, token_type="access")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user
