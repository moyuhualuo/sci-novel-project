from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import engine
from app.middleware.request_context import RequestContextMiddleware
from app.models.base import Base
from app.services.seed_service import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Keep bootstrap deterministic for local demos and tests.
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_migrate_legacy_user_schema)
    await seed_database()
    yield


def _migrate_legacy_user_schema(sync_conn) -> None:
    inspector = inspect(sync_conn)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    statements: list[str] = []

    if "password_hash" not in existing_columns:
        statements.append("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
    if "is_verified" not in existing_columns:
        statements.append("ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0")

    for statement in statements:
        sync_conn.execute(text(statement))


def create_application() -> FastAPI:
    settings = get_settings()
    upload_dir = Path(settings.upload_dir).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)
    app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)
    app.add_middleware(RequestContextMiddleware)

    @app.middleware("http")
    async def security_headers(request, call_next):
        # Basic browser hardening that every internet-facing app should ship with.
        response = await call_next(request)
        response.headers["x-frame-options"] = "DENY"
        response.headers["x-content-type-options"] = "nosniff"
        response.headers["referrer-policy"] = "same-origin"
        return response

    app.include_router(api_router, prefix="/api/v1")
    app.mount(settings.upload_url_path, StaticFiles(directory=upload_dir), name="uploads")
    return app


app = create_application()
