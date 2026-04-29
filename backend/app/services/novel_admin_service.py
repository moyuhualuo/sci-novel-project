import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.novel import NovelSection, SectionBlock
from app.models.site_profile import SiteProfile
from app.schemas.site import (
    ChangeLogItem,
    ChangeLogResponse,
    ContentBlockCreate,
    ContentBlockResponse,
    ContentBlockUpdate,
    LocalizedText,
    LocalizedTextInput,
    NovelSectionCreate,
    NovelSectionResponse,
    NovelSectionUpdate,
    SiteProfileResponse,
    SiteProfileUpdate,
    SiteResponse,
)


async def get_site_payload(db: AsyncSession) -> SiteResponse:
    sections_result = await db.execute(
        select(NovelSection).options(selectinload(NovelSection.blocks)).order_by(NovelSection.position, NovelSection.id)
    )
    sections = sections_result.scalars().unique().all()
    logs = await _list_change_logs(db)
    profile = await _get_or_create_site_profile(db)

    return SiteResponse(
        site_title=_decode_localized(profile.site_title),
        tagline=_decode_localized(profile.tagline),
        intro=_decode_localized(profile.intro),
        sections=[_serialize_section(section) for section in sections],
        change_logs=logs,
    )


async def get_change_logs(db: AsyncSession) -> ChangeLogResponse:
    return ChangeLogResponse(entries=await _list_change_logs(db))


async def update_site_profile(db: AsyncSession, payload: SiteProfileUpdate, actor: str) -> SiteProfileResponse:
    profile = await _get_or_create_site_profile(db)
    profile.site_title = _encode_localized(payload.site_title)
    profile.tagline = _encode_localized(payload.tagline)
    profile.intro = _encode_localized(payload.intro)
    db.add(
        AuditLog(
            actor=actor,
            action="update",
            target=payload.site_title.en,
            details=_build_audit_details("site_profile", payload.site_title, payload.site_title),
        )
    )
    await db.commit()
    return SiteProfileResponse(
        site_title=_decode_localized(profile.site_title),
        tagline=_decode_localized(profile.tagline),
        intro=_decode_localized(profile.intro),
    )


async def create_section(db: AsyncSession, payload: NovelSectionCreate, actor: str) -> NovelSectionResponse:
    section = NovelSection(
        slug=payload.slug,
        title=_encode_localized(payload.title),
        summary=_encode_localized(payload.summary),
        position=payload.position or await _next_section_position(db),
    )
    db.add(section)
    await db.flush()
    db.add(
        AuditLog(
            actor=actor,
            action="create",
            target=payload.title.en,
            details=_build_audit_details("section", payload.title, payload.title),
        )
    )
    await db.commit()
    return await _get_section_response(db, section.id)


async def update_section(
    db: AsyncSession, section_id: int, payload: NovelSectionUpdate, actor: str
) -> NovelSectionResponse | None:
    section = await db.get(NovelSection, section_id, options=[selectinload(NovelSection.blocks)])
    if section is None:
        return None

    section.slug = payload.slug
    section.title = _encode_localized(payload.title)
    section.summary = _encode_localized(payload.summary)
    section.position = payload.position or section.position
    db.add(
        AuditLog(
            actor=actor,
            action="update",
            target=payload.title.en,
            details=_build_audit_details("section", payload.title, payload.title),
        )
    )
    await db.commit()
    return await _get_section_response(db, section.id)


async def delete_section(db: AsyncSession, section_id: int, actor: str) -> bool:
    section = await db.get(NovelSection, section_id, options=[selectinload(NovelSection.blocks)])
    if section is None:
        return False

    section_title = _decode_localized(section.title)
    await db.delete(section)
    db.add(
        AuditLog(
            actor=actor,
            action="delete",
            target=section_title.en,
            details=_build_audit_details("section", section_title, section_title),
        )
    )
    await db.commit()
    return True


async def add_block(
    db: AsyncSession, section_id: int, payload: ContentBlockCreate, actor: str
) -> ContentBlockResponse | None:
    section = await db.get(NovelSection, section_id)
    if section is None:
        return None

    block = SectionBlock(
        section_id=section_id,
        title=_encode_localized(payload.title),
        kind=payload.kind,
        content=_encode_localized(payload.content),
        image_url=payload.image_url,
        position=payload.position or await _next_block_position(db, section_id),
    )
    db.add(block)
    await db.flush()
    db.add(
        AuditLog(
            actor=actor,
            action="create",
            target=_decode_localized(section.title).en,
            details=_build_audit_details("block", _decode_localized(section.title), payload.title),
        )
    )
    await db.commit()
    await db.refresh(block)
    return _serialize_block(block)


async def update_block(
    db: AsyncSession, block_id: int, payload: ContentBlockUpdate, actor: str
) -> ContentBlockResponse | None:
    block = await db.get(SectionBlock, block_id)
    if block is None:
        return None

    section = await db.get(NovelSection, block.section_id)
    section_title = _decode_localized(section.title) if section else LocalizedText(en="Unknown section", zh="\u672a\u77e5\u677f\u5757")
    block.title = _encode_localized(payload.title)
    block.kind = payload.kind
    block.content = _encode_localized(payload.content)
    block.image_url = payload.image_url
    block.position = payload.position or block.position
    db.add(
        AuditLog(
            actor=actor,
            action="update",
            target=section_title.en,
            details=_build_audit_details("block", section_title, payload.title),
        )
    )
    await db.commit()
    await db.refresh(block)
    return _serialize_block(block)


async def delete_block(db: AsyncSession, block_id: int, actor: str) -> bool:
    block = await db.get(SectionBlock, block_id)
    if block is None:
        return False

    section = await db.get(NovelSection, block.section_id)
    section_title = _decode_localized(section.title) if section else LocalizedText(en="Unknown section", zh="\u672a\u77e5\u677f\u5757")
    block_title = _decode_localized(block.title)
    await db.delete(block)
    db.add(
        AuditLog(
            actor=actor,
            action="delete",
            target=section_title.en,
            details=_build_audit_details("block", section_title, block_title),
        )
    )
    await db.commit()
    return True


async def _list_change_logs(db: AsyncSession, limit: int = 20) -> list[ChangeLogItem]:
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    audits = result.scalars().all()
    return [_serialize_log(audit) for audit in audits]


def _serialize_section(section: NovelSection) -> NovelSectionResponse:
    blocks = sorted(section.blocks, key=lambda block: (block.position, block.id))
    return NovelSectionResponse(
        id=section.id,
        slug=section.slug,
        title=_decode_localized(section.title),
        summary=_decode_localized(section.summary),
        position=section.position,
        blocks=[_serialize_block(block) for block in blocks],
    )


def _serialize_block(block: SectionBlock) -> ContentBlockResponse:
    return ContentBlockResponse(
        id=block.id,
        section_id=block.section_id,
        title=_decode_localized(block.title),
        kind=block.kind,
        content=_decode_localized(block.content),
        image_url=block.image_url,
        position=block.position,
    )


def _serialize_log(audit: AuditLog) -> ChangeLogItem:
    category, section_title, content_title = _parse_audit_details(audit.details, audit.target)
    return ChangeLogItem(
        id=audit.id,
        actor=audit.actor,
        action=audit.action,
        section_title=section_title,
        content_title=content_title,
        summary=_log_summary(category, section_title, content_title, audit.action),
        changed_at=audit.created_at.strftime("%Y-%m-%d %H:%M"),
    )


def _decode_localized(raw: str | None) -> LocalizedText:
    if not raw:
        return LocalizedText(en="", zh="")
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            en = str(data.get("en", ""))
            zh = str(data.get("zh", en))
            return LocalizedText(en=en, zh=zh)
    except json.JSONDecodeError:
        pass
    return LocalizedText(en=raw, zh=raw)


def _encode_localized(value: LocalizedTextInput | LocalizedText) -> str:
    return json.dumps({"en": value.en, "zh": value.zh}, ensure_ascii=False)


def _build_audit_details(category: str, section_title: LocalizedTextInput | LocalizedText, content_title: LocalizedTextInput | LocalizedText) -> str:
    return json.dumps(
        {
            "category": category,
            "section_title": {"en": section_title.en, "zh": section_title.zh},
            "content_title": {"en": content_title.en, "zh": content_title.zh},
        },
        ensure_ascii=False,
    )


def _parse_audit_details(details: str, fallback_target: str) -> tuple[str, LocalizedText, LocalizedText]:
    if not details:
        fallback = LocalizedText(en=fallback_target, zh=fallback_target)
        return "content", fallback, fallback

    try:
        data = json.loads(details)
        if isinstance(data, dict):
            category = str(data.get("category", "content"))
            section_title = _localized_from_value(data.get("section_title"), fallback_target)
            content_title = _localized_from_value(data.get("content_title"), section_title.en)
            return category, section_title, content_title
    except json.JSONDecodeError:
        pass

    parts = details.split("|")
    section_name = parts[1] if len(parts) > 1 else fallback_target
    content_name = parts[2] if len(parts) > 2 else section_name
    return parts[0] if parts else "content", LocalizedText(en=section_name, zh=section_name), LocalizedText(
        en=content_name, zh=content_name
    )


def _localized_from_value(value: object, fallback: str) -> LocalizedText:
    if isinstance(value, dict):
        en = str(value.get("en", fallback))
        zh = str(value.get("zh", en))
        return LocalizedText(en=en, zh=zh)
    if isinstance(value, str):
        return LocalizedText(en=value, zh=value)
    return LocalizedText(en=fallback, zh=fallback)


def _log_summary(
    category: str, section_title: LocalizedText, content_title: LocalizedText, action: str
) -> LocalizedText:
    verbs = {
        "create": ("Created", "\u5df2\u65b0\u589e"),
        "update": ("Updated", "\u5df2\u66f4\u65b0"),
        "delete": ("Deleted", "\u5df2\u5220\u9664"),
        "seed": ("Seeded", "\u5df2\u521d\u59cb\u5316"),
    }
    verb_en, verb_zh = verbs.get(action, (action.title(), action))
    if category == "site_profile":
        return LocalizedText(
            en=f"{verb_en} site introduction copy.",
            zh=f"{verb_zh}\u7ad9\u70b9\u4ecb\u7ecd\u6587\u6848\u3002",
        )
    if category == "section":
        return LocalizedText(
            en=f'{verb_en} section "{section_title.en}".',
            zh=f'{verb_zh}\u677f\u5757\u300c{section_title.zh}\u300d\u3002',
        )
    return LocalizedText(
        en=f'{verb_en} "{content_title.en}" in "{section_title.en}".',
        zh=f'{verb_zh}\u300c{section_title.zh}\u300d\u4e2d\u7684\u300c{content_title.zh}\u300d\u3002',
    )


async def _next_section_position(db: AsyncSession) -> int:
    result = await db.scalar(select(func.max(NovelSection.position)))
    return (result or 0) + 1


async def _next_block_position(db: AsyncSession, section_id: int) -> int:
    result = await db.scalar(select(func.max(SectionBlock.position)).where(SectionBlock.section_id == section_id))
    return (result or 0) + 1


async def _get_or_create_site_profile(db: AsyncSession) -> SiteProfile:
    profile = await db.scalar(select(SiteProfile).limit(1))
    if profile is not None:
        return profile

    profile = SiteProfile(
        site_title=_encode_localized(LocalizedText(en="Sci-Fi Novel Introduction", zh="\u79d1\u5e7b\u5c0f\u8bf4\u4ecb\u7ecd")),
        tagline=_encode_localized(
            LocalizedText(
                en="A bilingual sci-fi novel introduction site with world-building, visuals, and editorial history.",
                zh="\u4e00\u4e2a\u53ef\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u7528\u4e8e\u5c55\u793a\u79d1\u5e7b\u5c0f\u8bf4\u8bbe\u5b9a\u3001\u89c6\u89c9\u4e0e\u7f16\u8f91\u8bb0\u5f55\u7684\u4ecb\u7ecd\u7ad9\u70b9\u3002",
            )
        ),
        intro=_encode_localized(
            LocalizedText(
                en="Browse each section from the edge-pinned sidebar, switch between Chinese and English, choose from day, night, mist, or eye-care amber palettes, and sign in only when you need to edit sci-fi novel text or images in place.",
                zh="\u4ece\u8d34\u8fb9\u4fa7\u8fb9\u680f\u6d4f\u89c8\u5404\u4e2a\u677f\u5757\uff0c\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u5e76\u5728\u767d\u5929\u3001\u9ed1\u591c\u3001\u96fe\u84dd\u548c\u62a4\u773c\u9ec4\u4e3b\u9898\u4e4b\u95f4\u5207\u6362\uff0c\u9700\u8981\u4fee\u6539\u79d1\u5e7b\u5c0f\u8bf4\u6587\u5b57\u4e0e\u56fe\u7247\u65f6\u518d\u767b\u5f55\u5373\u53ef\u76f4\u63a5\u7f16\u8f91\u3002",
            )
        ),
    )
    db.add(profile)
    await db.flush()
    return profile


async def _get_section_response(db: AsyncSession, section_id: int) -> NovelSectionResponse:
    result = await db.execute(
        select(NovelSection).options(selectinload(NovelSection.blocks)).where(NovelSection.id == section_id)
    )
    section = result.scalar_one()
    return _serialize_section(section)
