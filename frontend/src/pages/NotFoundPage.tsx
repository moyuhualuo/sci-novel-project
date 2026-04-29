import type { Locale } from "../lib/i18n";
import { uiCopy } from "../lib/i18n";
import { StatePanel } from "../components/StatePanel";

type NotFoundPageProps = {
  locale: Locale;
  kind?: "route" | "section";
  path?: string;
  onHome: () => void;
  onLogs: () => void;
};

export function NotFoundPage({ locale, kind = "route", path, onHome, onLogs }: NotFoundPageProps) {
  const copy = uiCopy[locale];
  const title = kind === "section" ? copy.sectionNotFoundTitle : copy.pageNotFound;
  const description =
    kind === "section"
      ? copy.sectionNotFoundHint
      : path
        ? `${copy.pageNotFoundHint} (${path})`
        : copy.pageNotFoundHint;

  return (
    <main className="state-page">
      <StatePanel
        eyebrow="404"
        title={title}
        description={description}
        actions={[
          { label: copy.returnToArchive, onClick: onHome },
          { label: copy.openLogs, tone: "ghost", onClick: onLogs },
        ]}
      />
    </main>
  );
}
