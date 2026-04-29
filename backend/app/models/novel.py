from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class NovelSection(TimestampMixin, Base):
    __tablename__ = "novel_sections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer, default=1)

    blocks: Mapped[list["SectionBlock"]] = relationship(
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="SectionBlock.position",
    )


class SectionBlock(TimestampMixin, Base):
    __tablename__ = "section_blocks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("novel_sections.id"))
    title: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(20), default="text")
    content: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[int] = mapped_column(Integer, default=1)

    section: Mapped[NovelSection] = relationship(back_populates="blocks")

