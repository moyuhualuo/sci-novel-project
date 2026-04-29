import logging
import time
from uuid import uuid4

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", str(uuid4()))
        request.state.request_id = request_id
        start = time.perf_counter()

        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        logger = logging.LoggerAdapter(logging.getLogger("scifi.request"), {"request_id": request_id})
        settings = get_settings()
        cookie_present = settings.cookie_name in request.cookies
        # This line captures enough context for ops analysis without logging secrets.
        logger.info(
            "%s %s status=%s duration_ms=%s cookie_present=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            cookie_present,
        )

        response.headers["x-request-id"] = request_id
        return response
