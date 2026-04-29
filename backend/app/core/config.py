from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="Sci-Fi Novel Introduction", alias="SCIFI_APP_NAME")
    environment: str = Field(default="local", alias="SCIFI_ENVIRONMENT")
    database_url: str = Field(default="sqlite+aiosqlite:///./scifi_novel.db", alias="SCIFI_DATABASE_URL")
    frontend_url: str = Field(default="http://localhost:5173", alias="SCIFI_FRONTEND_URL")
    allowed_origins: str = Field(default="http://localhost:5173", alias="SCIFI_ALLOWED_ORIGINS")
    cookie_name: str = Field(default="scifi_session", alias="SCIFI_COOKIE_NAME")
    cookie_secure: bool = Field(default=False, alias="SCIFI_COOKIE_SECURE")
    cookie_samesite: str = Field(default="lax", alias="SCIFI_COOKIE_SAMESITE")
    session_secret: str = Field(default="please-change-me", alias="SCIFI_SESSION_SECRET")
    verification_token_ttl_minutes: int = Field(default=60 * 24, alias="SCIFI_VERIFICATION_TOKEN_TTL_MINUTES")
    admin_email: str = Field(default="admin@scifi.local", alias="SCIFI_ADMIN_EMAIL")
    admin_password: str = Field(default="ChangeMe123!", alias="SCIFI_ADMIN_PASSWORD")
    log_path: str = Field(default="logs/scifi_novel.log", alias="SCIFI_LOG_PATH")
    upload_dir: str = Field(default="uploads", alias="SCIFI_UPLOAD_DIR")
    upload_url_path: str = Field(default="/uploads", alias="SCIFI_UPLOAD_URL_PATH")
    smtp_host: str = Field(default="", alias="SCIFI_SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SCIFI_SMTP_PORT")
    smtp_username: str = Field(default="", alias="SCIFI_SMTP_USERNAME")
    smtp_password: str = Field(default="", alias="SCIFI_SMTP_PASSWORD")
    smtp_from_email: str = Field(default="", alias="SCIFI_SMTP_FROM_EMAIL")
    smtp_from_name: str = Field(default="", alias="SCIFI_SMTP_FROM_NAME")
    smtp_starttls: bool = Field(default=True, alias="SCIFI_SMTP_STARTTLS")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
