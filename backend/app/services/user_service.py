from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import decode_session_cookie
from app.db.session import get_db
from app.models.user import User


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | bool]:
    settings = get_settings()
    payload = decode_session_cookie(request.cookies.get(settings.cookie_name))
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    email = str(payload.get("email", "")).strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return {
        "email": user.email,
        "role": user.role,
        "verified": user.is_verified,
        "full_name": user.full_name,
    }


def require_editor(user: dict[str, str | bool] = Depends(get_current_user)) -> dict[str, str | bool]:
    if not user.get("verified"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
    if user.get("role") not in {"admin", "editor"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Editor only")
    return user


def require_admin(user: dict[str, str | bool] = Depends(get_current_user)) -> dict[str, str | bool]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return user
