import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { apiClient } from "./api/client";
import { Header } from "./components/Header";
import { fallbackSite } from "./data/mock";
import type { LoginPayload, RegisterPayload, SessionState, SiteResponse } from "./data/types";
import { pickText, themeModes, uiCopy, type Locale, type ThemeMode } from "./lib/i18n";

type RouteState =
  | { name: "home" }
  | { name: "section"; slug: string }
  | { name: "admin" }
  | { name: "logs" }
  | { name: "notFound"; path: string };

function parseRoute(): RouteState {
  const { pathname } = window.location;

  if (pathname === "/") {
    return { name: "home" };
  }
  if (pathname.startsWith("/section/")) {
    const slug = decodeURIComponent(pathname.replace("/section/", "")).trim();
    return slug ? { name: "section", slug } : { name: "notFound", path: pathname };
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return { name: "admin" };
  }
  if (pathname === "/logs" || pathname.startsWith("/logs/")) {
    return { name: "logs" };
  }

  return { name: "notFound", path: pathname };
}

function pathForRoute(route: RouteState): string {
  if (route.name === "section") {
    return `/section/${encodeURIComponent(route.slug)}`;
  }
  if (route.name === "admin") {
    return "/admin";
  }
  if (route.name === "logs") {
    return "/logs";
  }
  if (route.name === "notFound") {
    return route.path;
  }
  return "/";
}

const AdminPage = lazy(async () => ({ default: (await import("./pages/AdminPage")).AdminPage }));
const LogsPage = lazy(async () => ({ default: (await import("./pages/LogsPage")).LogsPage }));
const NotFoundPage = lazy(async () => ({ default: (await import("./pages/NotFoundPage")).NotFoundPage }));
const ShopHome = lazy(async () => ({ default: (await import("./pages/ShopHome")).ShopHome }));
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/$/, "");
const technologyLinks = [
  { label: "React", href: "https://react.dev/" },
  { label: "FastAPI", href: "https://fastapi.tiangolo.com/" },
  { label: "PostgreSQL", href: "https://www.postgresql.org/" },
] as const;

function upsertMeta(selector: string, attrs: Record<string, string>, content: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(selector: string, rel: string, href: string) {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function getStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem("scifi-theme");
  return themeModes.includes(stored as ThemeMode) ? (stored as ThemeMode) : "day";
}

function getNextTheme(current: ThemeMode): ThemeMode {
  const index = themeModes.indexOf(current);
  return themeModes[(index + 1) % themeModes.length] ?? "day";
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(parseRoute());
  const [site, setSite] = useState<SiteResponse>(fallbackSite);
  const [session, setSession] = useState<SessionState>({ authenticated: false });
  const [locale, setLocale] = useState<Locale>(() => (window.localStorage.getItem("scifi-locale") === "zh" ? "zh" : "en"));
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [returnRoute, setReturnRoute] = useState<RouteState>({ name: "home" });
  const [ready, setReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const copy = uiCopy[locale];

  const currentSection = useMemo(() => {
    if (route.name !== "section") {
      return null;
    }
    return site.sections.find((section) => section.slug === route.slug) ?? null;
  }, [route, site.sections]);

  const load = async (mode: "initial" | "refresh" = "refresh") => {
    if (mode === "initial") {
      setReady(false);
    }

    const [me, siteData] = await Promise.all([
      apiClient.getSession().catch(() => ({ authenticated: false })),
      apiClient
        .getSite()
        .then((data) => ({ data, fallback: false }))
        .catch(() => ({ data: fallbackSite, fallback: true })),
    ]);

    setSession(me);
    setSite(siteData.data);
    setUsingFallback(siteData.fallback);
    setReady(true);
  };

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("scifi-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("scifi-locale", locale);
  }, [locale]);

  useEffect(() => {
    void load("initial");
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    const sectionTitle = route.name === "section" && currentSection ? pickText(currentSection.title, locale) : "";
    const siteTitle = pickText(site.site_title, locale);
    const pageTitle =
      route.name === "admin"
        ? copy.adminPage
        : route.name === "logs"
          ? copy.logsTitle
          : route.name === "notFound"
            ? copy.pageNotFound
            : route.name === "section"
              ? sectionTitle || copy.sectionNotFoundTitle
              : siteTitle;

    const description =
      route.name === "admin"
        ? copy.loginHint
        : route.name === "logs"
          ? copy.logsIntro
          : route.name === "notFound"
            ? copy.pageNotFoundHint
            : route.name === "section" && currentSection
              ? pickText(currentSection.summary, locale)
              : pickText(site.intro, locale);

    const canonicalUrl = `${SITE_URL || window.location.origin}${window.location.pathname}`;
    const shareImage = `${SITE_URL || window.location.origin}/og-cover.svg`;
    const themeColor = {
      day: "#213b59",
      amber: "#8f6327",
      mist: "#315764",
      night: "#0d1520",
    } satisfies Record<ThemeMode, string>;

    document.title =
      route.name === "home" ? siteTitle : `${pageTitle} | ${siteTitle}`;
    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, pageTitle);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, "website");
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, shareImage);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, pageTitle);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, shareImage);
    upsertMeta('meta[name="theme-color"]', { name: "theme-color" }, themeColor[theme]);
    upsertLink('link[rel="canonical"]', "canonical", canonicalUrl);
  }, [
    copy.adminPage,
    copy.loginHint,
    copy.logsIntro,
    copy.logsTitle,
    copy.pageNotFound,
    copy.pageNotFoundHint,
    copy.sectionNotFoundTitle,
    currentSection,
    locale,
    route,
    site.intro,
    site.site_title,
    theme,
  ]);

  const navigate = (nextRoute: RouteState) => {
    const nextPath = pathForRoute(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setRoute(nextRoute);
  };

  const openAdmin = () => {
    if (route.name === "home" || route.name === "section") {
      setReturnRoute(route);
    }
    navigate({ name: "admin" });
  };

  const handleLogin = async (payload: LoginPayload) => {
    await apiClient.login(payload);
    await load();
    navigate(returnRoute.name === "admin" ? { name: "home" } : returnRoute);
  };

  const handleRegister = async (payload: RegisterPayload) => {
    await apiClient.register(payload);
  };

  const handleResendVerification = async (email: string) => {
    await apiClient.resendVerification(email);
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setSession({ authenticated: false });
    await load();
    if (route.name === "admin") {
      navigate({ name: "home" });
    }
  };

  const title =
    route.name === "notFound"
      ? { en: uiCopy.en.pageNotFound, zh: uiCopy.zh.pageNotFound }
      : currentSection?.title ?? site.site_title;
  const tagline =
    route.name === "notFound"
      ? { en: uiCopy.en.pageNotFoundHint, zh: uiCopy.zh.pageNotFoundHint }
      : currentSection?.summary ?? site.tagline;
  const showSearch = ready && (route.name === "home" || route.name === "section");
  const sectionRouteMissing = ready && route.name === "section" && !currentSection;

  return (
    <div className={`app-shell ${session.authenticated ? "authenticated-shell" : "guest-shell"}`}>
      <Header
        route={route.name}
        title={title}
        tagline={tagline}
        locale={locale}
        theme={theme}
        showSearch={showSearch}
        searchQuery={searchQuery}
        authenticated={session.authenticated}
        sessionEmail={session.email}
        onSearchChange={setSearchQuery}
        onHome={() => navigate({ name: "home" })}
        onLogs={() => navigate({ name: "logs" })}
        onOpenAdmin={openAdmin}
        onLogout={() => void handleLogout()}
        onToggleLocale={() => setLocale((current) => (current === "en" ? "zh" : "en"))}
        onCycleTheme={() => setTheme((current) => getNextTheme(current))}
      />
      {usingFallback ? (
        <section className="service-banner" role="status" aria-live="polite">
          <div>
            <strong>{copy.serviceBannerTitle}</strong>
            <p>{copy.serviceFallback}</p>
          </div>
          <button className="ghost-button" onClick={() => void load()}>
            {copy.retryLoad}
          </button>
        </section>
      ) : null}

      <Suspense
        fallback={
          <main className="state-page">
            <section className="state-panel compact">
              <p>{copy.loadingArchive}</p>
            </section>
          </main>
        }
      >
        {route.name === "notFound" ? (
          <NotFoundPage locale={locale} path={route.path} onHome={() => navigate({ name: "home" })} onLogs={() => navigate({ name: "logs" })} />
        ) : sectionRouteMissing ? (
          <NotFoundPage locale={locale} kind="section" onHome={() => navigate({ name: "home" })} onLogs={() => navigate({ name: "logs" })} />
        ) : route.name === "admin" ? (
          <AdminPage
            site={site}
            session={session}
            locale={locale}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onResendVerification={handleResendVerification}
            onOpenEditor={() => navigate(returnRoute.name === "admin" ? { name: "home" } : returnRoute)}
          />
        ) : route.name === "logs" ? (
          <LogsPage site={site} locale={locale} />
        ) : (
          <ShopHome
            site={site}
            locale={locale}
            session={session}
            searchQuery={searchQuery}
            activeSectionSlug={route.name === "section" ? route.slug : null}
            onSelectSection={(slug) => navigate({ name: "section", slug })}
            onGoHome={() => navigate({ name: "home" })}
            onOpenLogs={() => navigate({ name: "logs" })}
            onRefresh={load}
          />
        )}
      </Suspense>

      <footer className="site-footnote">
        <p className="footnote-credit">
          <span>{copy.builtWithAiWorkflow}</span>
          <span className="footnote-separator">{"\u00b7"}</span>
          <span>{copy.techStack}</span>
          <span className="footnote-tech-links">
            {technologyLinks.map((link, index) => (
              <span key={link.label} className="footnote-tech-item">
                {index > 0 ? <span className="footnote-tech-divider">/</span> : null}
                <a className="footnote-tech-link" href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </span>
            ))}
          </span>
          <span className="footnote-separator">{"\u00b7"}</span>
          <span>
            {copy.authorBy} moyu
            <button
              className="footnote-secret"
              onClick={openAdmin}
              aria-label={copy.hiddenEditorAccess}
              title={copy.hiddenEditorAccess}
            >
              .
            </button>
          </span>
        </p>
      </footer>
    </div>
  );
}
