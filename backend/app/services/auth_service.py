from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == normalize_email(email)))
    return result.scalar_one_or_none()


async def register_editor(
    db: AsyncSession,
    *,
    full_name: str,
    email: str,
    password: str,
) -> tuple[User, bool]:
    normalized_email = normalize_email(email)
    existing = await get_user_by_email(db, normalized_email)
    password_hash = hash_password(password)

    if existing is not None:
        if existing.is_verified:
            raise ValueError("Email already registered")
        existing.full_name = full_name.strip()
        existing.password_hash = password_hash
        if existing.role != "admin":
            existing.role = "editor"
        await db.commit()
        await db.refresh(existing)
        return existing, False

    user = User(
        email=normalized_email,
        full_name=full_name.strip(),
        role="editor",
        password_hash=password_hash,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user, True


async def authenticate_user(db: AsyncSession, email: str, password: str) -> tuple[User | None, str | None]:
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None, "invalid_credentials"
    if not user.is_verified:
        return None, "email_not_verified"
    return user, None


async def mark_user_verified(db: AsyncSession, email: str) -> tuple[User | None, str]:
    user = await get_user_by_email(db, email)
    if user is None:
        return None, "invalid"
    if user.is_verified:
        return user, "already_verified"

    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    return user, "verified"
