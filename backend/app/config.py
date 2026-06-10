from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    DATABASE_URL: str = "sqlite+aiosqlite:///./examforge.db"
    SECRET_KEY: str = "change-me-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    TECTONIC_PATH: str = "tectonic"
    PDF_OUTPUT_DIR: str = "./pdfs"
    FRONTEND_URL: str = "http://localhost:5173"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
