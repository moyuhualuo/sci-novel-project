from pydantic import BaseModel


class MetricCard(BaseModel):
    title: str
    value: str
    delta: str


class SalesTableRow(BaseModel):
    period: str
    revenue: float
    orders: int
    average_order_value: float
    conversion_rate: float


class AuditRow(BaseModel):
    actor: str
    action: str
    target: str
    created_at: str


class LogEntry(BaseModel):
    timestamp: str
    level: str
    request_id: str
    message: str


class AdminDashboardResponse(BaseModel):
    metrics: list[MetricCard]
    sales_table: list[SalesTableRow]
    audits: list[AuditRow]


class LogFeedResponse(BaseModel):
    entries: list[LogEntry]

