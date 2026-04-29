import { useEffect, useRef, useState } from "react";

import type { LocalizedText } from "../data/types";
import { pickText, themeModes, uiCopy, type Locale, type ThemeMode } from "../lib/i18n";
import {
  AmberIcon,
  BrandIcon,
  GlobeIcon,
  HomeIcon,
  LogsIcon,
  MistIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "./Icons";

type HeaderProps = {
  route: "home" | "section" | "admin" | "logs" | "notFound";
  title: LocalizedText;
  tagline: LocalizedText;
  locale: Locale;
  theme: ThemeMode;
  showSearch: boolean;
  searchQuery: string;
  authenticated: boolean;
  sessionEmail?: string;
  onSearchChange: (value: string) => void;
  onHome: () => void;
  onLogs: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onToggleLocale: () => void;
  onCycleTheme: () => void;
};

export function Header({
  route,
  title,
  tagline,
  locale,
  theme,
  showSearch,
  searchQuery,
  authenticated,
  sessionEmail,
  onSearchChange,
  onHome,
  onLogs,
  onOpenAdmin,
  onLogout,
  onToggleLocale,
  onCycleTheme,
}: HeaderProps) {
  const copy = uiCopy[locale];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const themeLabels = {
    day: copy.day,
    amber: copy.amber,
    mist: copy.mist,
    night: copy.night,
  } satisfies Record<ThemeMode, string>;

  const themeIcons = {
    day: SunIcon,
    amber: AmberIcon,
    mist: MistIcon,
    night: MoonIcon,
  } satisfies Record<ThemeMode, typeof SunIcon>;
  const themeIndex = themeModes.indexOf(theme);
  const nextTheme = themeModes[(themeIndex + 1) % themeModes.length] ?? "day";
  const ThemeIcon = themeIcons[theme];

  const eyebrow =
    route === "admin"
      ? copy.adminPage
      : route === "logs"
        ? copy.logs
        : route === "notFound"
          ? copy.pageNotFound
          : route === "section"
            ? copy.sectionView
            : copy.archiveHome;

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const accountLabel = sessionEmail ?? "admin@scifi.local";
  const avatarText = accountLabel.slice(0, 2).toUpperCase();

  return (
    <div className="top-bar-shell">
      <div className="top-bar-reveal-zone" />
      <header className="top-bar">
        <div className="top-bar-handle" />
        <div className="topbar-layout">
          <div className="brand-block">
            <div className="brand-mark">
              <BrandIcon className="brand-icon" />
            </div>
            <p className="eyebrow">{eyebrow}</p>
            <div>
              <h1>{pickText(title, locale)}</h1>
              <p className="topbar-copy">{pickText(tagline, locale)}</p>
            </div>
          </div>

          {showSearch ? (
            <label className="topbar-search">
              <span>{copy.search}</span>
              <div className="topbar-search-field">
                <SearchIcon className="control-icon search-field-icon" />
                <input
                  value={searchQuery}
                  placeholder={copy.searchPlaceholder}
                  onChange={(event) => onSearchChange(event.target.value)}
                />
              </div>
            </label>
          ) : null}
        </div>

        <div className="topbar-actions">
          <button
            className={route === "home" ? "action-button nav-action-button" : "ghost-button nav-action-button"}
            onClick={onHome}
            title={copy.homeLabel}
            aria-label={copy.homeLabel}
          >
            <HomeIcon className="control-icon" />
            <span>{copy.home}</span>
          </button>

          <button
            className={route === "logs" ? "action-button nav-action-button" : "ghost-button nav-action-button"}
            onClick={onLogs}
            title={copy.logsLabel}
            aria-label={copy.logsLabel}
          >
            <LogsIcon className="control-icon" />
            <span>{copy.logs}</span>
          </button>

          <button
            className="icon-button locale-button"
            onClick={onToggleLocale}
            title={`${copy.languageToggle}: ${locale === "en" ? copy.english : copy.chinese}`}
            aria-label={`${copy.languageToggle}: ${locale === "en" ? copy.english : copy.chinese}`}
          >
            <GlobeIcon className="control-icon" />
            <span className="icon-badge">{locale === "en" ? "EN" : "ZH"}</span>
          </button>

          <button
            className="icon-button theme-cycle-button"
            data-theme-mode={theme}
            onClick={onCycleTheme}
            title={`${copy.themeToggle}: ${themeLabels[nextTheme]}`}
            aria-label={`${copy.themeToggle}: ${themeLabels[nextTheme]}`}
          >
            <ThemeIcon className="control-icon" />
          </button>

          {authenticated ? (
            <div className="account-menu" ref={menuRef}>
              <button
                className="account-trigger"
                onClick={() => setMenuOpen((current) => !current)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="account-avatar">{avatarText}</span>
                <span className="account-copy">
                  <strong>{copy.liveEditor}</strong>
                  <small>{accountLabel}</small>
                </span>
              </button>

              {menuOpen ? (
                <div className="account-dropdown" role="menu">
                  <button
                    className="account-dropdown-button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAdmin();
                    }}
                  >
                    {copy.openLiveEditor}
                  </button>
                  <button
                    className="account-dropdown-button"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    {copy.logout}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}
