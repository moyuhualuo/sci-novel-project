# Sci-Fi Novel Introduction Architecture

## Design Goals

- build a production-shaped full-stack sci-fi novel introduction site on top of `ASGI`
- keep local development simple with SQLite fallback
- expose clean seams for image storage, search, and future content workflows
- make observability, testing, and backup part of the first release

## System Overview

```text
React Reader + Editorial Console
        |
        v
FastAPI (ASGI) -> Services -> SQLAlchemy -> PostgreSQL
        |                         |
        |                         +-> backup script / editorial analytics
        |
        +-> rotating logs -> admin log API
        +-> signed HttpOnly cookie sessions
```

## Backend Layers

### API Layer

- `app/api/routes/*.py`
- responsible for request validation, HTTP mapping, and response schemas

### Service Layer

- `app/services/*.py`
- business rules for authentication, story browsing, content editing, upload handling, and log parsing

### Persistence Layer

- `app/models/*.py`
- SQLAlchemy entities for users, story sections, content blocks, and audit records

### Cross-Cutting Concerns

- `app/core/config.py` for environment settings
- `app/middleware/request_context.py` for request IDs and cookie tracing
- `app/core/logging.py` for rotating file logs

## Frontend Modules

- `src/components`: reusable cards, tables, and header components
- `src/pages`: reading pages, logs page, and admin login
- `src/api/client.ts`: typed fetch wrapper with cookie credentials
- `src/data/mock.ts`: local fallback experience when backend is unavailable

## Security v1.0

- signed `HttpOnly` session cookie
- `sameSite=lax`
- role check for admin routes
- CORS allowlist
- central security headers middleware

## Enterprise Follow-Ups

- OAuth2 or SSO provider integration
- Supabase Storage or object storage integration
- background workers for thumbnail generation and editorial reports
- Alembic migrations and storage lifecycle backups
- SIEM forwarding and metrics via Prometheus / OpenTelemetry
