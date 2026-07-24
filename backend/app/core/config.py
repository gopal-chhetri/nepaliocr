from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = Field(default="Nepali OCR API")
    VERSION: str = Field(default="1.0.0")
    API_V1_STR: str = Field(default="/api/v1")
    SERVER_PORT: int = Field(default=8000)
    FRONTEND_URL: str = Field(default="http://localhost:3000/")
    BACKEND_CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    MAX_IMAGE_SIZE: int = Field(default=10 * 1024 * 1024)
    ALLOWED_IMAGE_TYPES: List[str] = Field(default=["image/jpeg", "image/png"])

    OPENROUTER_API_KEYS: List[str] = Field(default_factory=list)

    @field_validator("OPENROUTER_API_KEYS", mode="before")
    @classmethod
    def parse_openrouter_keys(cls, v: Union[str, list, None]) -> list:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                import json
                return json.loads(stripped)
            return [stripped]
        return []

    OPENROUTER_MODEL: str = Field(default="google/gemini-2.0-flash-exp:free")

    ENGINE_ORDER: str = Field(default="openrouter")

    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=5432)
    DB_USER: str = Field(default="postgres")
    DB_PASS: str = Field(default="postgres")
    DB_NAME: str = Field(default="nepaliocr")
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASS}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    JWT_SECRET: str = Field(default="change-me-in-production")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRY_MINUTES: int = Field(default=15)

    RATE_LIMIT_PER_MINUTE: int = Field(default=10)
    DAILY_LIMIT_AUTHENTICATED: int = Field(default=25)
    DAILY_LIMIT_ANONYMOUS: int = Field(default=10)

    def get_cors_origins(self) -> List[str]:
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.FRONTEND_URL and self.FRONTEND_URL.strip("/") not in origins:
            origins.append(self.FRONTEND_URL.strip("/"))
        return origins

    model_config = {"case_sensitive": True, "env_file": ".env", "extra": "forbid"}


settings = Settings()