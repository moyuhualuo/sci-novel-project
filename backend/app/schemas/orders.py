from pydantic import BaseModel


class OrderMetric(BaseModel):
    label: str
    value: float


class OrderItemRow(BaseModel):
    order_no: str
    status: str
    total_amount: float
    created_at: str


class OrderSummaryResponse(BaseModel):
    kpis: list[OrderMetric]
    orders: list[OrderItemRow]

