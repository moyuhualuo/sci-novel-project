from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class SiteProfile(TimestampMixin, Base):
    __tablename__ = "site_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    site_title: Mapped[str] = mapped_column(String(255))
    tagline: Mapped[str] = mapped_column(Text)
    intro: Mapped[str] = mapped_column(Text)
