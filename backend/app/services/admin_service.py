from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog
from app.models.order import Order
from app.schemas.admin import AdminDashboardResponse, AuditRow, MetricCard, SalesTableRow


async def build_admin_dashboard(db: AsyncSession) -> AdminDashboardResponse:
    orders_result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    audits_result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(5))

    orders = orders_result.scalars().all()
    audits = audits_result.scalars().all()

    revenue = sum(order.total_amount for order in orders)
    order_count = len(orders)
    aov = revenue / order_count if order_count else 0
    paid_orders = len([order for order in orders if order.status == "paid"])
    conversion_rate = round((paid_orders / max(order_count, 1)) * 100, 1)

    sales_table = []
    for index, order in enumerate(orders[:6], start=1):
        sales_table.append(
            SalesTableRow(
                period=f"Batch {index}",
                revenue=round(order.total_amount, 2),
                orders=1,
                average_order_value=round(order.total_amount, 2),
                conversion_rate=conversion_rate,
            )
        )

    return AdminDashboardResponse(
        metrics=[
            MetricCard(title="Gross Revenue", value=f"${revenue:,.2f}", delta="+12.4%"),
            MetricCard(title="Orders", value=str(order_count), delta="+8 this week"),
            MetricCard(title="AOV", value=f"${aov:,.2f}", delta="+4.8%"),
            MetricCard(title="Conversion", value=f"{conversion_rate}%", delta="+1.2pts"),
        ],
        sales_table=sales_table,
        audits=[
            AuditRow(
                actor=audit.actor,
                action=audit.action,
                target=audit.target,
                created_at=audit.created_at.strftime("%Y-%m-%d %H:%M"),
            )
            for audit in audits
        ],
    )

