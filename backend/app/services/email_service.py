from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_verification_email(*, recipient_email: str, recipient_name: str, verification_url: str) -> None:
    settings = get_settings()
    sender = settings.smtp_from_email.strip()

    if not settings.smtp_host.strip() or not sender:
        logger.info("SMTP not configured. Verification link for %s: %s", recipient_email, verification_url)
        return

    subject = f"{settings.app_name} email verification"
    display_name = recipient_name.strip() or recipient_email
    text_body = (
        f"Hello {display_name},\n\n"
        f"Please verify your email address by opening this link:\n{verification_url}\n\n"
        "If you did not request this registration, you can safely ignore this email."
    )
    html_body = (
        f"<p>Hello {display_name},</p>"
        f"<p>Please verify your email address by opening the link below:</p>"
        f'<p><a href="{verification_url}">{verification_url}</a></p>'
        "<p>If you did not request this registration, you can safely ignore this email.</p>"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        f'{settings.smtp_from_name.strip() or settings.app_name} <{sender}>'
        if settings.smtp_from_name.strip()
        else sender
    )
    message["To"] = recipient_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    await asyncio.to_thread(_deliver_message, message)


def _deliver_message(message: EmailMessage) -> None:
    settings = get_settings()
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_starttls:
            smtp.starttls()
        if settings.smtp_username.strip():
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
