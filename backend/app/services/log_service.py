from pathlib import Path

from app.core.config import get_settings
from app.schemas.admin import LogEntry, LogFeedResponse


def read_recent_logs(limit: int = 20) -> LogFeedResponse:
    log_path = Path(get_settings().log_path)
    if not log_path.exists():
        return LogFeedResponse(entries=[])

    lines = log_path.read_text(encoding="utf-8").splitlines()[-limit:]
    entries: list[LogEntry] = []
    for line in lines:
        parts = [part.strip() for part in line.split("|", maxsplit=4)]
        if len(parts) < 5:
            continue
        timestamp, level, _logger_name, request_id_part, message = parts
        request_id = request_id_part.replace("request_id=", "", 1)
        entries.append(LogEntry(timestamp=timestamp, level=level, request_id=request_id, message=message))
    return LogFeedResponse(entries=entries)

