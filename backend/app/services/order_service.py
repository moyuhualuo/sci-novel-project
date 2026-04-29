from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.schemas.orders import OrderItemRow, OrderMetric, OrderSummaryResponse


async def build_order_summary(db: AsyncSession) -> OrderSummaryResponse:
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    orders = result.scalars().all()

    total_revenue = sum(order.total_amount for order in orders)
    total_orders = len(orders)
    average_order = total_revenue / total_orders if total_orders else 0

    return OrderSummaryResponse(
        kpis=[
            OrderMetric(label="Revenue", value=round(total_revenue, 2)),
            OrderMetric(label="Orders", value=float(total_orders)),
            OrderMetric(label="AOV", value=round(average_order, 2)),
        ],
        orders=[
            OrderItemRow(
                order_no=order.order_no,
                status=order.status,
                total_amount=order.total_amount,
                created_at=order.created_at.strftime("%Y-%m-%d %H:%M"),
            )
            for order in orders
        ],
    )

