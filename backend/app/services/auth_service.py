import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from app.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import ConflictException, UnauthorizedException
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import LoginRequest, TokenResponse
from app.schemas.user_schema import UserCreate, UserResponse


class AuthService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, data: UserCreate) -> UserResponse:
        """
        Registra un nuevo usuario.
        Verifica duplicados de username y email antes de crear.
        La contraseña se hashea con bcrypt — nunca se almacena en texto plano.
        """
        if await self.repo.get_by_username(data.username):
            raise ConflictException("El nombre de usuario ya está en uso")
        if await self.repo.get_by_email(data.email):
            raise ConflictException("El correo ya está registrado")

        user = User(
            id=uuid.uuid4(),
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            role="teacher",
        )
        created = await self.repo.create(user)
        return UserResponse.model_validate(created)

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Autentica un usuario y retorna access + refresh tokens.
        Usa el mismo mensaje de error para credencial inválida y usuario no encontrado
        para evitar enumeración de usuarios.
        """
        user = await self.repo.get_by_username(data.username)
        if not user or not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Credenciales inválidas")
        if not user.is_active:
            raise UnauthorizedException("La cuenta está desactivada")

        payload = {"sub": str(user.id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(payload),
            refresh_token=create_refresh_token(payload),
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """
        Emite un nuevo access token desde un refresh token válido.
        Valida el claim 'type' para evitar que un access token sea usado como refresh token.
        """
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Tipo de token inválido")
            user = await self.repo.get_by_id(uuid.UUID(payload["sub"]))
            if not user or not user.is_active:
                raise UnauthorizedException("Usuario no encontrado o inactivo")
        except JWTError:
            raise UnauthorizedException("Token de refresco inválido o expirado")

        new_payload = {"sub": str(user.id), "role": user.role}
        return TokenResponse(
            access_token=create_access_token(new_payload),
            refresh_token=create_refresh_token(new_payload),
        )

    async def get_current_user(self, token: str) -> User:
        """
        Valida un access token y retorna el usuario correspondiente.
        Usado por las dependencias de los routers para proteger endpoints.
        """
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise UnauthorizedException("Tipo de token inválido")
            user = await self.repo.get_by_id(uuid.UUID(payload["sub"]))
        except (JWTError, KeyError, ValueError):
            raise UnauthorizedException("Token inválido o expirado")

        if not user or not user.is_active:
            raise UnauthorizedException("Usuario no encontrado")
        return user