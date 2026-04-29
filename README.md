# Sci-Fi Novel Introduction 1.0

Sci-Fi Novel Introduction is a bilingual full-stack story presentation site built around `FastAPI` on `ASGI`.
This repository delivers a v1.0 baseline with:

- `FastAPI` backend with typed APIs, cookie-based auth, audit-friendly logging, and image upload support
- `React + TypeScript` frontend for section browsing, live editorial updates, and activity logs
- `SQLAlchemy` data model for story sections, content blocks, users, and audit records
- test suites, backup scripts, Docker orchestration, and architecture docs

## Tech Stack

### Backend

- Runtime: Python 3.12
- Web: FastAPI, Uvicorn, Starlette
- Package manager: uv
- ORM: SQLAlchemy 2.x async
- Validation: Pydantic v2
- Database: PostgreSQL in Docker, SQLite fallback for local smoke runs
- Logging: standard logging with rotating file handler
- Testing: pytest, httpx, pytest-asyncio

### Frontend

- Runtime: Node.js 22+
- UI: React 18 + TypeScript + Vite
- Styling: custom design system CSS
- Charts and tables: Recharts + semantic HTML tables
- Package manager: pnpm

### Platform

- Cache/session extension point: Redis
- Containers: Docker Compose
- Docs: Markdown + FastAPI OpenAPI docs

## Monorepo Layout

```text
.
|-- backend/
|   |-- app/
|   |-- scripts/
|   `-- tests/
|-- docs/
|-- frontend/
|-- docker-compose.yml
`-- pnpm-workspace.yaml
```

## Quick Start

### 1. Backend

```bash
cd backend
python -m pip install --target .deps fastapi uvicorn[standard] sqlalchemy asyncpg aiosqlite pydantic-settings itsdangerous httpx greenlet email-validator pytest pytest-asyncio
set PYTHONPATH=D:\codex\backend\.deps;D:\codex\backend
python -m uvicorn app.main:app --reload
```

Windows shortcut:

```bat
cd D:\codex\backend
run_local.cmd
```

Backend docs:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Docker

```bash
docker compose up --build
```

## Demo Credentials

- Admin email: `admin@scifi.local`
- Admin password: `ChangeMe123!`

The login API writes an `HttpOnly` cookie named `scifi_session`.

## Enterprise Features Included in v1.0

- Cookie-based session authentication
- role-aware admin analytics endpoints
- rotating backend log files with request IDs
- sales KPI tables and request log inspection API
- PostgreSQL backup script for scheduled jobs
- sample domain model for catalog, orders, and audit logs
- fully typed API contracts and frontend API client
- seed data for local evaluation

## Key Docs

- [Architecture](docs/architecture.md)
- [Delivery Scope](docs/delivery-scope.md)
- [UI/UX Notes](docs/ui-ux.md)
- [中文部署文档](docs/deployment.zh-CN.md)

## Notes

- `uv` and `pnpm` are the recommended package managers for this stack.
- If they are not installed on the target machine, use `pip` and `npm` as temporary fallbacks.
- This repository also supports project-local installs in `backend/.deps` and `frontend/node_modules`.
- Production should replace demo credentials, rotate secrets, and wire object storage, payment gateways, and CI/CD secrets management.
