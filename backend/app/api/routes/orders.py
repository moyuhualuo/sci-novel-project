from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.orders import OrderSummaryResponse
from app.services.order_service import build_order_summary

router = APIRouter()


@router.get("/summary", response_model=OrderSummaryResponse)
async def get_order_summary(db: AsyncSession = Depends(get_db)) -> OrderSummaryResponse:
    return await build_order_summary(db)

