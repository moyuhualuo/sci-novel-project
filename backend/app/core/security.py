from __future__ import annotations

import hashlib
import hmac
import secrets

from itsdangerous import BadSignature, SignatureExpired, URLSafeSerializer, URLSafeTimedSerializer
from starlette.responses import Response

from app.core.config import get_settings


def _serializer() -> URLSafeSerializer:
    settings = get_settings()
    return URLSafeSerializer(settings.session_secret, salt="scifi-session")


def _verification_serializer() -> URLSafeTimedSerializer:
    settings = get_settings()
    return URLSafeTimedSerializer(settings.session_secret, salt="scifi-email-verification")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 600_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False

    try:
        algorithm, iteration_text, salt, digest_hex = stored_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    try:
        iterations = int(iteration_text)
    except ValueError:
        return False

    expected = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations).hex()
    return hmac.compare_digest(expected, digest_hex)


def create_email_verification_token(email: str) -> str:
    return _verification_serializer().dumps({"email": email, "purpose": "verify-email"})


def decode_email_verification_token(token: str, max_age_seconds: int) -> str | None:
    try:
        payload = _verification_serializer().loads(token, max_age=max_age_seconds)
    except SignatureExpired as exc:
        raise exc
    except BadSignature:
        return None

    if payload.get("purpose") != "verify-email":
        return None
    email = str(payload.get("email", "")).strip().lower()
    return email or None


def create_session_cookie(response: Response, email: str, role: str) -> None:
    settings = get_settings()
    token = _serializer().dumps({"email": email, "role": role})
    same_site = settings.cookie_samesite.strip().lower() or "lax"
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=same_site,
        max_age=60 * 60 * 12,
    )


def decode_session_cookie(token: str | None) -> dict[str, str] | None:
    if not token:
        return None
    try:
        return _serializer().loads(token)
    except BadSignature:
        return None
