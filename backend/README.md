# Backend

This service provides the sci-fi novel introduction APIs, cookie auth, editorial logging, and image upload access.

## Commands

```bash
uv sync
uv run uvicorn app.main:app --reload
uv run pytest
uv run python -m scripts.backup_db
```
