type MetricCardProps = {
  title: string;
  value: string;
  detail: string;
};

export function MetricCard({ title, value, detail }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

