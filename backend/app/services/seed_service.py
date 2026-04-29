import json

from sqlalchemy import delete, func, select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.audit import AuditLog
from app.models.novel import NovelSection, SectionBlock
from app.models.site_profile import SiteProfile
from app.models.user import User


async def seed_database() -> None:
    settings = get_settings()
    async with SessionLocal() as session:
        admin = await session.scalar(select(User).where(User.email == settings.admin_email))
        if admin is None:
            admin = User(
                email=settings.admin_email,
                full_name="Sci-Fi Archive Editor",
                role="admin",
                password_hash=hash_password(settings.admin_password),
                is_verified=True,
            )
            session.add(admin)
        else:
            admin.full_name = "Sci-Fi Archive Editor"
            admin.role = "admin"
            admin.password_hash = hash_password(settings.admin_password)
            admin.is_verified = True

        first_section = await session.scalar(select(NovelSection).order_by(NovelSection.id).limit(1))
        if first_section is not None and not _looks_localized(first_section.title):
            # Reset the old single-language demo content once so the upgraded bilingual site renders correctly.
            await session.execute(delete(SectionBlock))
            await session.execute(delete(NovelSection))
            await session.execute(delete(AuditLog))
            await session.commit()

        section_count = await session.scalar(select(func.count(NovelSection.id)))
        if section_count:
            profile = await session.scalar(select(SiteProfile).limit(1))
            if profile is None:
                session.add(
                    SiteProfile(
                        site_title=_localized("Sci-Fi Novel Introduction", "\u79d1\u5e7b\u5c0f\u8bf4\u4ecb\u7ecd"),
                        tagline=_localized(
                            "A bilingual sci-fi novel introduction site with world-building, visuals, and editorial history.",
                            "\u4e00\u4e2a\u53ef\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u7528\u4e8e\u5c55\u793a\u79d1\u5e7b\u5c0f\u8bf4\u8bbe\u5b9a\u3001\u89c6\u89c9\u4e0e\u7f16\u8f91\u8bb0\u5f55\u7684\u4ecb\u7ecd\u7ad9\u70b9\u3002",
                        ),
                        intro=_localized(
                            "Browse each section from the edge-pinned sidebar, switch between Chinese and English, choose from day, night, mist, or eye-care amber palettes, and sign in only when you need to edit sci-fi novel text or images in place.",
                            "\u4ece\u8d34\u8fb9\u4fa7\u8fb9\u680f\u6d4f\u89c8\u5404\u4e2a\u677f\u5757\uff0c\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u5e76\u5728\u767d\u5929\u3001\u9ed1\u591c\u3001\u96fe\u84dd\u548c\u62a4\u773c\u9ec4\u4e3b\u9898\u4e4b\u95f4\u5207\u6362\uff0c\u9700\u8981\u4fee\u6539\u79d1\u5e7b\u5c0f\u8bf4\u6587\u5b57\u4e0e\u56fe\u7247\u65f6\u518d\u767b\u5f55\u5373\u53ef\u76f4\u63a5\u7f16\u8f91\u3002",
                        ),
                    )
                )
            await session.commit()
            return

        session.add(
            SiteProfile(
                site_title=_localized("Sci-Fi Novel Introduction", "\u79d1\u5e7b\u5c0f\u8bf4\u4ecb\u7ecd"),
                tagline=_localized(
                    "A bilingual sci-fi novel introduction site with world-building, visuals, and editorial history.",
                    "\u4e00\u4e2a\u53ef\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u7528\u4e8e\u5c55\u793a\u79d1\u5e7b\u5c0f\u8bf4\u8bbe\u5b9a\u3001\u89c6\u89c9\u4e0e\u7f16\u8f91\u8bb0\u5f55\u7684\u4ecb\u7ecd\u7ad9\u70b9\u3002",
                ),
                intro=_localized(
                    "Browse each section from the edge-pinned sidebar, switch between Chinese and English, choose from day, night, mist, or eye-care amber palettes, and sign in only when you need to edit sci-fi novel text or images in place.",
                    "\u4ece\u8d34\u8fb9\u4fa7\u8fb9\u680f\u6d4f\u89c8\u5404\u4e2a\u677f\u5757\uff0c\u5207\u6362\u4e2d\u82f1\u6587\uff0c\u5e76\u5728\u767d\u5929\u3001\u9ed1\u591c\u3001\u96fe\u84dd\u548c\u62a4\u773c\u9ec4\u4e3b\u9898\u4e4b\u95f4\u5207\u6362\uff0c\u9700\u8981\u4fee\u6539\u79d1\u5e7b\u5c0f\u8bf4\u6587\u5b57\u4e0e\u56fe\u7247\u65f6\u518d\u767b\u5f55\u5373\u53ef\u76f4\u63a5\u7f16\u8f91\u3002",
                ),
            )
        )

        sections = [
            NovelSection(
                slug="story-overview",
                title=_localized(
                    "Story Overview",
                    "\u6545\u4e8b\u6982\u89c8",
                ),
                summary=_localized(
                    "Introduce the setting, central conflict, and emotional tone of the novel.",
                    "\u7528\u7b80\u77ed\u7684\u677f\u5757\u4ecb\u7ecd\u4e16\u754c\u89c2\u3001\u4e3b\u7ebf\u51b2\u7a81\u4e0e\u9605\u8bfb\u6c1b\u56f4\u3002",
                ),
                position=1,
            ),
            NovelSection(
                slug="characters",
                title=_localized(
                    "Character Ensemble",
                    "\u4eba\u7269\u7fa4\u50cf",
                ),
                summary=_localized(
                    "Show the protagonist, rival, and key supporting cast with their emotional tensions.",
                    "\u5c55\u793a\u4e3b\u89d2\u3001\u5bf9\u624b\u4e0e\u5173\u952e\u914d\u89d2\uff0c\u7a81\u51fa\u4ed6\u4eec\u4e4b\u95f4\u7684\u60c5\u611f\u5f20\u529b\u3002",
                ),
                position=2,
            ),
            NovelSection(
                slug="world-building",
                title=_localized(
                    "World Building",
                    "\u4e16\u754c\u8bbe\u5b9a",
                ),
                summary=_localized(
                    "Map the era, city structure, rules, and hidden secrets behind the story.",
                    "\u6574\u7406\u65f6\u4ee3\u80cc\u666f\u3001\u57ce\u5e02\u7ed3\u6784\u3001\u89c4\u5219\u4f53\u7cfb\u4e0e\u9690\u85cf\u79d8\u5bc6\u3002",
                ),
                position=3,
            ),
        ]
        session.add_all(sections)
        await session.flush()

        blocks = [
            SectionBlock(
                section_id=sections[0].id,
                title=_localized("Synopsis", "\u4f5c\u54c1\u7b80\u4ecb"),
                kind="text",
                content=_localized(
                    "The Silent Corridor follows an amnesiac restoration archivist as she rebuilds her past inside a fog-locked city and discovers that its memories have been rewritten.",
                    "\u300a\u5bc2\u9759\u56de\u5eca\u300b\u8bb2\u8ff0\u4e00\u4f4d\u5931\u5fc6\u7684\u6863\u6848\u4fee\u590d\u5e08\uff0c\u5728\u88ab\u96fe\u5c01\u95ed\u7684\u65e7\u57ce\u4e2d\u62fc\u51d1\u81ea\u5df1\u7684\u8fc7\u53bb\uff0c\u5e76\u53d1\u73b0\u6574\u5ea7\u57ce\u5e02\u7684\u8bb0\u5fc6\u90fd\u88ab\u91cd\u65b0\u7f16\u6392\u3002",
                ),
                image_url="",
                position=1,
            ),
            SectionBlock(
                section_id=sections[0].id,
                title=_localized("Key Visual Poster", "\u4e3b\u89c6\u89c9\u6d77\u62a5"),
                kind="image",
                content=_localized(
                    "Night light, a corridor, and an old archive room shape the visual mood.",
                    "\u591c\u8272\u3001\u957f\u5eca\u4e0e\u65e7\u6863\u6848\u5ba4\u5171\u540c\u6784\u6210\u4e3b\u89c6\u89c9\u6c1b\u56f4\u3002",
                ),
                image_url="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
                position=2,
            ),
            SectionBlock(
                section_id=sections[1].id,
                title=_localized("Lead Character", "\u5973\u4e3b\u89d2"),
                kind="text",
                content=_localized(
                    "Lin Wu is an archive restorer with an unusual sensitivity to voice and damaged text.",
                    "\u6797\u96fe\u662f\u4e00\u4f4d\u6863\u6848\u4fee\u590d\u5e08\uff0c\u5bf9\u58f0\u97f3\u4e0e\u6b8b\u7f3a\u6587\u5b57\u6709\u5f02\u5e38\u654f\u9510\u7684\u611f\u77e5\u3002",
                ),
                image_url="",
                position=1,
            ),
            SectionBlock(
                section_id=sections[2].id,
                title=_localized("Old City Map", "\u65e7\u57ce\u5730\u56fe"),
                kind="image",
                content=_localized(
                    "The city is divided into lamp districts, echo vaults, and a sealed northern tower.",
                    "\u8fd9\u5ea7\u57ce\u5e02\u88ab\u5206\u4e3a\u5730\u4e0a\u706f\u533a\u3001\u5730\u4e0b\u56de\u58f0\u5e93\u548c\u88ab\u5c01\u9501\u7684\u5317\u5854\u533a\u3002",
                ),
                image_url="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                position=1,
            ),
        ]

        session.add_all(blocks)
        session.add_all(
            [
                AuditLog(
                    actor="system",
                    action="seed",
                    target="Story Overview",
                    details=_audit_details("section", "Story Overview", "\u6545\u4e8b\u6982\u89c8", "Story Overview", "\u6545\u4e8b\u6982\u89c8"),
                ),
                AuditLog(
                    actor=settings.admin_email,
                    action="create",
                    target="Character Ensemble",
                    details=_audit_details("block", "Character Ensemble", "\u4eba\u7269\u7fa4\u50cf", "Lead Character", "\u5973\u4e3b\u89d2"),
                ),
                AuditLog(
                    actor=settings.admin_email,
                    action="create",
                    target="World Building",
                    details=_audit_details("block", "World Building", "\u4e16\u754c\u8bbe\u5b9a", "Old City Map", "\u65e7\u57ce\u5730\u56fe"),
                ),
            ]
        )
        await session.commit()


def _localized(en: str, zh: str) -> str:
    return json.dumps({"en": en, "zh": zh}, ensure_ascii=False)


def _audit_details(category: str, section_en: str, section_zh: str, content_en: str, content_zh: str) -> str:
    return json.dumps(
        {
            "category": category,
            "section_title": {"en": section_en, "zh": section_zh},
            "content_title": {"en": content_en, "zh": content_zh},
        },
        ensure_ascii=False,
    )


def _looks_localized(raw: str) -> bool:
    return raw.strip().startswith("{")
