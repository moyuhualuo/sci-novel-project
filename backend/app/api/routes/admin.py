from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.site import (
    ChangeLogResponse,
    ImageUploadRequest,
    ImageUploadResponse,
    ContentBlockCreate,
    ContentBlockResponse,
    ContentBlockUpdate,
    NovelSectionCreate,
    NovelSectionResponse,
    NovelSectionUpdate,
    SiteProfileResponse,
    SiteProfileUpdate,
    SiteResponse,
)
from app.services.novel_admin_service import (
    add_block,
    create_section,
    delete_block,
    delete_section,
    get_change_logs,
    get_site_payload,
    update_block,
    update_site_profile,
    update_section,
)
from app.services.upload_service import store_uploaded_image
from app.services.user_service import require_editor

router = APIRouter()


@router.get("/content", response_model=SiteResponse)
async def get_admin_content(
    _: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> SiteResponse:
    return await get_site_payload(db)


@router.put("/site-profile", response_model=SiteProfileResponse)
async def update_admin_site_profile(
    payload: SiteProfileUpdate,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> SiteProfileResponse:
    return await update_site_profile(db, payload, actor=user["email"])


@router.post("/sections", response_model=NovelSectionResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_section(
    payload: NovelSectionCreate,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> NovelSectionResponse:
    return await create_section(db, payload, actor=user["email"])


@router.put("/sections/{section_id}", response_model=NovelSectionResponse)
async def update_admin_section(
    section_id: int,
    payload: NovelSectionUpdate,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> NovelSectionResponse:
    section = await update_section(db, section_id, payload, actor=user["email"])
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


@router.delete("/sections/{section_id}")
async def delete_admin_section(
    section_id: int,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    deleted = await delete_section(db, section_id, actor=user["email"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return {"success": True}


@router.post("/sections/{section_id}/blocks", response_model=ContentBlockResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_block(
    section_id: int,
    payload: ContentBlockCreate,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> ContentBlockResponse:
    block = await add_block(db, section_id, payload, actor=user["email"])
    if block is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return block


@router.put("/blocks/{block_id}", response_model=ContentBlockResponse)
async def update_admin_block(
    block_id: int,
    payload: ContentBlockUpdate,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> ContentBlockResponse:
    block = await update_block(db, block_id, payload, actor=user["email"])
    if block is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    return block


@router.delete("/blocks/{block_id}")
async def delete_admin_block(
    block_id: int,
    user: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    deleted = await delete_block(db, block_id, actor=user["email"])
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")
    return {"success": True}


@router.get("/logs", response_model=ChangeLogResponse)
async def get_admin_logs(
    _: dict = Depends(require_editor),
    db: AsyncSession = Depends(get_db),
) -> ChangeLogResponse:
    return await get_change_logs(db)


@router.post("/uploads/images", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_admin_image(
    payload: ImageUploadRequest,
    request: Request,
    _: dict = Depends(require_editor),
) -> ImageUploadResponse:
    return store_uploaded_image(payload, request)
