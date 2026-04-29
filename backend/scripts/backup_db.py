from __future__ import annotations

import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings


def backup_sqlite(database_url: str, destination: Path) -> Path:
    source = Path(database_url.replace("sqlite+aiosqlite:///", "", 1))
    destination.mkdir(parents=True, exist_ok=True)
    backup_path = destination / f"sqlite-backup-{datetime.now():%Y%m%d-%H%M%S}.db"
    # File copy is enough for SQLite because the database lives in a single file.
    shutil.copy2(source, backup_path)
    return backup_path


def backup_postgres(database_url: str, destination: Path) -> Path:
    parsed = urlparse(database_url.replace("+asyncpg", "", 1))
    destination.mkdir(parents=True, exist_ok=True)
    backup_path = destination / f"postgres-backup-{datetime.now():%Y%m%d-%H%M%S}.sql"

    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    command = [
        "pg_dump",
        "-h",
        parsed.hostname or "localhost",
        "-p",
        str(parsed.port or 5432),
        "-U",
        parsed.username or "postgres",
        "-d",
        parsed.path.lstrip("/"),
        "-f",
        str(backup_path),
    ]
    # Use the native database tool so backups stay portable across environments.
    subprocess.run(command, check=True, env=env)
    return backup_path


def main() -> None:
    settings = get_settings()
    destination = Path("backups")
    if settings.database_url.startswith("sqlite"):
        backup_path = backup_sqlite(settings.database_url, destination)
    else:
        backup_path = backup_postgres(settings.database_url, destination)
    print(f"Backup created at {backup_path}")


if __name__ == "__main__":
    main()
