import { DataTable } from "../components/DataTable";
import { MetricCard } from "../components/MetricCard";
import type { ChangeLogItem, SiteResponse } from "../data/types";
import type { Locale } from "../lib/i18n";
import { pickText, uiCopy } from "../lib/i18n";

type LogsPageProps = {
  site: SiteResponse;
  locale: Locale;
};

type ActionKind = "created" | "updated" | "deleted";

type CalendarCell = {
  key: string;
  label: string;
  count: number;
};

const actionOrder: ActionKind[] = ["created", "updated", "deleted"];

function inferAction(log: ChangeLogItem): ActionKind {
  const actionText = `${log.action} ${log.summary.en}`.toLowerCase();

  if (/(create|created|add|insert|new)/.test(actionText)) {
    return "created";
  }
  if (/(delete|remove|deleted)/.test(actionText)) {
    return "deleted";
  }

  return "updated";
}

function getActionLabel(copy: { createdChanges: string; updatedChanges: string; deletedChanges: string }, action: ActionKind): string {
  if (action === "created") {
    return copy.createdChanges;
  }
  if (action === "deleted") {
    return copy.deletedChanges;
  }
  return copy.updatedChanges;
}

function parseLogDate(value: string): Date {
  return new Date(`${value.replace(" ", "T")}:00`);
}

function formatDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarCells(logs: ChangeLogItem[], locale: Locale): CalendarCell[] {
  const latestDate = logs[0] ? parseLogDate(logs[0].changed_at) : new Date();
  const activityByDay = new Map<string, number>();

  logs.forEach((log) => {
    const key = log.changed_at.slice(0, 10);
    activityByDay.set(key, (activityByDay.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(latestDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(latestDate.getDate() - (34 - index));

    const key = formatDayKey(date);
    return {
      key,
      label: locale === "zh" ? key.split("-").join(".") : key,
      count: activityByDay.get(key) ?? 0,
    };
  });
}

function getHeatLevel(value: number, maxValue: number): number {
  if (value <= 0) {
    return 0;
  }

  const ratio = value / Math.max(maxValue, 1);
  if (ratio >= 0.85) {
    return 4;
  }
  if (ratio >= 0.6) {
    return 3;
  }
  if (ratio >= 0.3) {
    return 2;
  }
  return 1;
}

export function LogsPage({ site, locale }: LogsPageProps) {
  const copy = uiCopy[locale];
  const logs = [...site.change_logs].sort((left, right) => right.changed_at.localeCompare(left.changed_at));
  const actionGroups = {
    created: [] as ChangeLogItem[],
    updated: [] as ChangeLogItem[],
    deleted: [] as ChangeLogItem[],
  };

  logs.forEach((log) => {
    actionGroups[inferAction(log)].push(log);
  });

  const totalChanges = logs.length;
  const touchedSections = new Set(logs.map((log) => log.section_title.en)).size;
  const coverage = site.sections.length > 0 ? Math.round((touchedSections / site.sections.length) * 100) : 0;
  const totals = {
    created: actionGroups.created.length,
    updated: actionGroups.updated.length,
    deleted: actionGroups.deleted.length,
  };
  const totalForRatio = Math.max(totalChanges, 1);
  const crossValues = {
    top: Math.round((totals.created / totalForRatio) * 100),
    right: coverage,
    bottom: Math.round((totals.deleted / totalForRatio) * 100),
    left: Math.round((totals.updated / totalForRatio) * 100),
  };

  const centerX = 220;
  const centerY = 168;
  const maxArm = 92;
  const topY = centerY - (maxArm * crossValues.top) / 100;
  const rightX = centerX + (maxArm * crossValues.right) / 100;
  const bottomY = centerY + (maxArm * crossValues.bottom) / 100;
  const leftX = centerX - (maxArm * crossValues.left) / 100;
  const crossShapePoints = `${centerX},${topY} ${rightX},${centerY} ${centerX},${bottomY} ${leftX},${centerY}`;

  const calendarCells = buildCalendarCells(logs, locale);
  const calendarMax = Math.max(1, ...calendarCells.map((cell) => cell.count));
  const weekdayLabels = locale === "zh" ? ["一", "二", "三", "四", "五", "六", "日"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const tableRows = logs.map((log) => {
    const action = inferAction(log);

    return [
      log.changed_at,
      log.actor,
      pickText(log.section_title, locale),
      pickText(log.content_title, locale),
      (
        <div className="log-summary-cell">
          <span className={`log-badge ${action}`}>{getActionLabel(copy, action)}</span>
          <span>{pickText(log.summary, locale)}</span>
        </div>
      ),
    ];
  });

  return (
    <main className="logs-page">
      <section className="hero-panel logs-hero">
        <p className="eyebrow">{copy.logs}</p>
        <h2>{copy.logsTitle}</h2>
        <p className="hero-copy">
          {copy.logsIntro} {pickText(site.intro, locale)}
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3>{copy.archiveSignals}</h3>
        </div>
        <div className="metric-grid metric-grid-wide">
          <MetricCard title={copy.totalChanges} value={`${totalChanges}`} detail={copy.totalChangesHint} />
          <MetricCard title={copy.createdChanges} value={`${totals.created}`} detail={copy.createdChangesHint} />
          <MetricCard title={copy.updatedChanges} value={`${totals.updated}`} detail={copy.updatedChangesHint} />
          <MetricCard title={copy.deletedChanges} value={`${totals.deleted}`} detail={copy.deletedChangesHint} />
        </div>
      </section>

      <section className="chart-pair">
        <section className="panel chart-card">
          <div className="panel-header">
            <h3>{copy.crossChart}</h3>
          </div>
          <p className="chart-copy">{copy.crossLegend}</p>
          <div className="cross-chart-shell compact-cross-chart">
            <svg className="cross-chart-svg compact-cross-svg" viewBox="0 0 440 336" role="img" aria-label={copy.crossChart}>
              <line className="cross-axis-line" x1={centerX} y1="36" x2={centerX} y2="300" />
              <line className="cross-axis-line" x1="56" y1={centerY} x2="384" y2={centerY} />
              <circle className="cross-center-ring" cx={centerX} cy={centerY} r="11" />
              <circle className="cross-guide-dot" cx={centerX} cy={centerY} r="4" />
              <polygon className="cross-fill" points={crossShapePoints} />

              <circle className="cross-shadow-dot" cx={centerX} cy={topY} r="16" />
              <circle className="cross-shadow-dot" cx={rightX} cy={centerY} r="16" />
              <circle className="cross-shadow-dot" cx={centerX} cy={bottomY} r="16" />
              <circle className="cross-shadow-dot" cx={leftX} cy={centerY} r="16" />

              <circle className="cross-dot" cx={centerX} cy={topY} r="5" />
              <circle className="cross-dot" cx={rightX} cy={centerY} r="5" />
              <circle className="cross-dot" cx={centerX} cy={bottomY} r="5" />
              <circle className="cross-dot" cx={leftX} cy={centerY} r="5" />

              <text className="cross-label-value compact-label-value" x={centerX} y="24" textAnchor="middle">
                {crossValues.top}%
              </text>
              <text className="cross-label-text compact-label-text" x={centerX} y="46" textAnchor="middle">
                {copy.createdChanges}
              </text>

              <text className="cross-label-value compact-label-value" x="40" y={centerY - 6} textAnchor="end">
                {crossValues.left}%
              </text>
              <text className="cross-label-text compact-label-text" x="40" y={centerY + 16} textAnchor="end">
                {copy.updatedChanges}
              </text>

              <text className="cross-label-value compact-label-value" x="400" y={centerY - 6} textAnchor="start">
                {crossValues.right}%
              </text>
              <text className="cross-label-text compact-label-text" x="400" y={centerY + 16} textAnchor="start">
                {copy.coverageAxis}
              </text>

              <text className="cross-label-value compact-label-value" x={centerX} y="320" textAnchor="middle">
                {crossValues.bottom}%
              </text>
              <text className="cross-label-text compact-label-text" x={centerX} y="336" textAnchor="middle">
                {copy.deletedChanges}
              </text>
            </svg>
          </div>
        </section>

        <section className="panel chart-card">
          <div className="panel-header">
            <h3>{copy.dateHeatmap}</h3>
          </div>
          <p className="chart-copy">{copy.dateHeatmapLegend}</p>
          <div className="date-heatmap-panel">
            <div className="date-heatmap-head">
              {weekdayLabels.map((label) => (
                <span key={label} className="date-heatmap-day">
                  {label}
                </span>
              ))}
            </div>
            <div className="date-heatmap-grid">
              {calendarCells.map((cell) => (
                <div
                  key={cell.key}
                  className={`date-heatmap-cell level-${getHeatLevel(cell.count, calendarMax)}`}
                  title={`${cell.label} - ${cell.count} ${copy.entriesLabel}`}
                />
              ))}
            </div>
            <div className="date-heatmap-legend">
              <span>0</span>
              <div className="date-heatmap-legend-cells">
                {[0, 1, 2, 3, 4].map((level) => (
                  <span key={level} className={`date-heatmap-cell legend-cell level-${level}`} />
                ))}
              </div>
              <span>{calendarMax}</span>
            </div>
          </div>
        </section>
      </section>

      <section className="panel grouped-logs-panel compact-grouped-logs">
        <div className="panel-header">
          <h3>{copy.logsByAction}</h3>
        </div>
        <p className="chart-copy">{copy.groupedLogsLegend}</p>
        <div className="action-groups-grid compact-action-grid">
          {actionOrder.map((action) => {
            const items = actionGroups[action];
            const label = getActionLabel(copy, action);

            return (
              <article className={`action-log-card ${action} compact-action-card`} key={action}>
                <div className="action-log-card-header compact-action-header">
                  <div>
                    <h4>{label}</h4>
                    <span>
                      {items.length} {copy.entriesLabel}
                    </span>
                  </div>
                  <span className={`log-badge ${action}`}>{label}</span>
                </div>

                <div className="action-log-list compact-action-list">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div className="action-log-item compact-action-item" key={item.id}>
                        <span className="recent-update-time">{item.changed_at}</span>
                        <strong>{pickText(item.content_title, locale)}</strong>
                        <p>
                          {pickText(item.section_title, locale)} / {pickText(item.summary, locale)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="action-log-item compact-action-item">
                      <span className="recent-update-time">0 {copy.entriesLabel}</span>
                      <p>{copy.logsIntro}</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <DataTable
        title={copy.changeLog}
        columns={[copy.time, copy.editor, copy.section, copy.content, copy.summary]}
        rows={tableRows}
        emptyMessage={copy.noLogEntries}
      />
    </main>
  );
}
