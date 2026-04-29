from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.site import SiteResponse
from app.services.novel_admin_service import get_site_payload

router = APIRouter()


@router.get("", response_model=SiteResponse)
async def get_site(db: AsyncSession = Depends(get_db)) -> SiteResponse:
    return await get_site_payload(db)

