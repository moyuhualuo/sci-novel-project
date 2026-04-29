from __future__ import annotations

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from itsdangerous import SignatureExpired
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import RedirectResponse

from app.core.config import get_settings
from app.core.security import (
    create_email_verification_token,
    create_session_cookie,
    decode_email_verification_token,
)
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    RegistrationResponse,
    ResendVerificationRequest,
    SessionResponse,
)
from app.services.auth_service import authenticate_user, get_user_by_email, mark_user_verified, register_editor
from app.services.email_service import send_verification_email
from app.services.user_service import get_current_user

router = APIRouter()


def _build_verification_link(request: Request, email: str) -> str:
    token = create_email_verification_token(email)
    base_url = str(request.url_for("verify_email"))
    return f"{base_url}?{urlencode({'token': token})}"


def _verification_redirect(status_value: str) -> RedirectResponse:
    settings = get_settings()
    base_url = settings.frontend_url.rstrip("/") or "http://localhost:5173"
    target = f"{base_url}/admin?{urlencode({'verified': status_value})}"
    return RedirectResponse(target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> RegistrationResponse:
    try:
        user, _ = await register_editor(
            db,
            full_name=payload.full_name,
            email=payload.email,
            password=payload.password,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    verification_link = _build_verification_link(request, user.email)
    try:
        await send_verification_email(
            recipient_email=user.email,
            recipient_name=user.full_name,
            verification_url=verification_link,
        )
    except Exception as exc:  # pragma: no cover - network delivery depends on runtime config
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification email could not be sent",
        ) from exc

    return RegistrationResponse(
        email=user.email,
        verification_required=True,
        message="Verification email sent",
    )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    payload: ResendVerificationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    user = await get_user_by_email(db, payload.email)
    if user is None or user.is_verified:
        return MessageResponse(success=True, message="If the account is pending verification, a new email has been sent")

    verification_link = _build_verification_link(request, user.email)
    try:
        await send_verification_email(
            recipient_email=user.email,
            recipient_name=user.full_name,
            verification_url=verification_link,
        )
    except Exception as exc:  # pragma: no cover - network delivery depends on runtime config
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification email could not be sent",
        ) from exc

    return MessageResponse(success=True, message="Verification email sent")


@router.get("/verify-email", name="verify_email")
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    settings = get_settings()
    try:
        email = decode_email_verification_token(token, settings.verification_token_ttl_minutes * 60)
    except SignatureExpired:
        return _verification_redirect("expired")

    if email is None:
        return _verification_redirect("invalid")

    _, state = await mark_user_verified(db, email)
    return _verification_redirect("success" if state == "verified" else state)


@router.post("/login", response_model=SessionResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    user, error_code = await authenticate_user(db, payload.email, payload.password)
    if user is None:
        detail = "Invalid credentials" if error_code == "invalid_credentials" else "Email not verified"
        status_code = status.HTTP_401_UNAUTHORIZED if error_code == "invalid_credentials" else status.HTTP_403_FORBIDDEN
        raise HTTPException(status_code=status_code, detail=detail)

    create_session_cookie(response, user.email, user.role)
    return SessionResponse(
        email=user.email,
        role=user.role,
        authenticated=True,
        full_name=user.full_name,
        verified=user.is_verified,
    )


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(get_settings().cookie_name)
    return {"success": True}


@router.get("/me", response_model=SessionResponse)
async def me(user=Depends(get_current_user)) -> SessionResponse:
    return SessionResponse(
        email=str(user["email"]),
        role=str(user["role"]),
        authenticated=True,
        full_name=str(user["full_name"]),
        verified=bool(user["verified"]),
    )
