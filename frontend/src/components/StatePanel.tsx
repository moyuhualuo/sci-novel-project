type StateAction = {
  label: string;
  tone?: "primary" | "ghost";
  onClick: () => void;
};

type StatePanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: StateAction[];
  compact?: boolean;
};

export function StatePanel({ eyebrow, title, description, actions = [], compact = false }: StatePanelProps) {
  return (
    <section className={compact ? "state-panel compact" : "state-panel"}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      <p className="hero-copy">{description}</p>
      {actions.length ? (
        <div className="state-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className={action.tone === "ghost" ? "ghost-button" : "action-button"}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
