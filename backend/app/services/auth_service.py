from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token_full
from app.utils.exceptions import ConflictError, UnauthorizedError


async def _cleanup_expired_tokens(db: AsyncSession) -> None:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.execute(delete(RevokedToken).where(RevokedToken.expires_at < now))


async def register_user(data: RegisterRequest, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictError(f"Email '{data.email}' is already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password),
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def login_user(data: LoginRequest, db: AsyncSession) -> dict:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise UnauthorizedError("Invalid email or password")
    if not user.is_active:
        raise UnauthorizedError("User account is inactive")

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> dict:
    payload = decode_token_full(refresh_token, token_type="refresh")
    jti: str | None = payload.get("jti")
    user_id: str | None = payload.get("sub")

    if not user_id:
        raise UnauthorizedError("Token is missing subject claim")

    # Reject revoked tokens
    if jti:
        revoked = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
        if revoked.scalar_one_or_none():
            raise UnauthorizedError("Token has been revoked")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    # Revoke the used refresh token (rotation)
    if jti:
        exp_ts = payload.get("exp", 0)
        expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc).replace(tzinfo=None)
        db.add(RevokedToken(jti=jti, expires_at=expires_at))
        await db.flush()

    await _cleanup_expired_tokens(db)

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


async def revoke_token(refresh_token: str, db: AsyncSession) -> None:
    try:
        payload = decode_token_full(refresh_token, token_type="refresh")
    except Exception:
        return  # Silently ignore invalid tokens on logout

    jti: str | None = payload.get("jti")
    if not jti:
        return

    existing = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
    if existing.scalar_one_or_none():
        return

    exp_ts = payload.get("exp", 0)
    expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc).replace(tzinfo=None)
    db.add(RevokedToken(jti=jti, expires_at=expires_at))
    await db.flush()

    await _cleanup_expired_tokens(db)
