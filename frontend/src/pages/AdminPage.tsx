import { useEffect, useState } from "react";

import { MetricCard } from "../components/MetricCard";
import { NoticeDialog } from "../components/NoticeDialog";
import type { LoginPayload, RegisterPayload, SessionState, SiteResponse } from "../data/types";
import type { Locale } from "../lib/i18n";
import { pickText, uiCopy } from "../lib/i18n";

type AdminPageProps = {
  site: SiteResponse;
  session: SessionState;
  locale: Locale;
  onLogin: (payload: LoginPayload) => Promise<void>;
  onRegister: (payload: RegisterPayload) => Promise<void>;
  onResendVerification: (email: string) => Promise<void>;
  onOpenEditor: () => void;
};

type AuthMode = "login" | "register";

type NoticeState = {
  title: string;
  description: string;
} | null;

export function AdminPage({
  site,
  session,
  locale,
  onLogin,
  onRegister,
  onResendVerification,
  onOpenEditor,
}: AdminPageProps) {
  const copy = uiCopy[locale];
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [credentials, setCredentials] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [registration, setRegistration] = useState<RegisterPayload & { confirmPassword: string }>({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (!verified) {
      return;
    }

    const messages: Record<string, NoticeState> = {
      success: {
        title: copy.verificationSuccessTitle,
        description: copy.verificationSuccessDescription,
      },
      expired: {
        title: copy.verificationExpiredTitle,
        description: copy.verificationExpiredDescription,
      },
      invalid: {
        title: copy.verificationInvalidTitle,
        description: copy.verificationInvalidDescription,
      },
      already_verified: {
        title: copy.verificationAlreadyTitle,
        description: copy.verificationAlreadyDescription,
      },
    };

    setNotice(messages[verified] ?? null);
    params.delete("verified");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [
    copy.verificationAlreadyDescription,
    copy.verificationAlreadyTitle,
    copy.verificationExpiredDescription,
    copy.verificationExpiredTitle,
    copy.verificationInvalidDescription,
    copy.verificationInvalidTitle,
    copy.verificationSuccessDescription,
    copy.verificationSuccessTitle,
  ]);

  const localizeMessage = (message: string) => {
    if (message === "Invalid email or password." || message === "Invalid credentials") {
      return copy.loginFailedDescription;
    }
    if (message === "Email not verified") {
      return copy.emailVerificationRequiredHint;
    }
    if (message === "Email already registered") {
      return copy.emailAlreadyRegistered;
    }
    if (message === "Verification email sent") {
      return copy.verificationEmailSent;
    }
    if (message === "If the account is pending verification, a new email has been sent") {
      return copy.resendVerificationSuccess;
    }
    if (message === "Verification email could not be sent") {
      return copy.serviceUnavailableMessage;
    }
    if (message === "Unable to reach the content service right now.") {
      return copy.serviceUnavailableMessage;
    }
    return message;
  };

  const handleLoginSubmit = async () => {
    if (!credentials.email.trim() || !credentials.password) {
      setCanResendVerification(false);
      setNotice({
        title: copy.loginFailedTitle,
        description: copy.loginFailedDescription,
      });
      return;
    }

    setSubmitting(true);
    try {
      await onLogin(credentials);
      setCanResendVerification(false);
    } catch (error) {
      const description = error instanceof Error ? localizeMessage(error.message) : copy.loginFailedDescription;
      setCanResendVerification(description === copy.emailVerificationRequiredHint);
      setNotice({
        title: description === copy.emailVerificationRequiredHint ? copy.emailVerificationRequired : copy.loginFailedTitle,
        description,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!registration.full_name.trim() || !registration.email.trim() || !registration.password) {
      setNotice({
        title: copy.registerFailedTitle,
        description: copy.registerFailedDescription,
      });
      return;
    }

    if (registration.password !== registration.confirmPassword) {
      setNotice({
        title: copy.registerFailedTitle,
        description: copy.passwordMismatch,
      });
      return;
    }

    setSubmitting(true);
    try {
      await onRegister({
        full_name: registration.full_name,
        email: registration.email,
        password: registration.password,
      });
      setCredentials((current) => ({ ...current, email: registration.email }));
      setAuthMode("login");
      setCanResendVerification(true);
      setNotice({
        title: copy.emailVerificationRequired,
        description: copy.verificationEmailSent,
      });
    } catch (error) {
      setNotice({
        title: copy.registerFailedTitle,
        description: error instanceof Error ? localizeMessage(error.message) : copy.registerFailedDescription,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    const email = (authMode === "register" ? registration.email : credentials.email).trim();
    if (!email) {
      return;
    }

    setResending(true);
    try {
      await onResendVerification(email);
      setNotice({
        title: copy.emailVerificationRequired,
        description: copy.resendVerificationSuccess,
      });
    } catch (error) {
      setNotice({
        title: copy.loginFailedTitle,
        description: error instanceof Error ? localizeMessage(error.message) : copy.serviceUnavailableMessage,
      });
    } finally {
      setResending(false);
    }
  };

  if (!session.authenticated) {
    return (
      <main className="admin-page">
        <NoticeDialog
          open={Boolean(notice)}
          title={notice?.title ?? ""}
          description={notice?.description ?? ""}
          buttonLabel={copy.dismiss}
          onClose={() => setNotice(null)}
        />
        <section className="login-panel admin-login-panel">
          <p className="eyebrow">{copy.adminPage}</p>
          <h2>{authMode === "login" ? copy.signInTab : copy.registerTab}</h2>

          <div className="auth-mode-toggle" role="tablist" aria-label={copy.adminPage}>
            <button
              className={authMode === "login" ? "action-button compact-button" : "ghost-button compact-button"}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              {copy.signInTab}
            </button>
            <button
              className={authMode === "register" ? "action-button compact-button" : "ghost-button compact-button"}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              {copy.registerTab}
            </button>
          </div>

          {authMode === "login" ? (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void handleLoginSubmit();
              }}
            >
              <label className="field-group">
                <span>{copy.email}</span>
                <input
                  autoComplete="username"
                  value={credentials.email}
                  onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="field-group">
                <span>{copy.password}</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <button className="action-button" disabled={submitting} type="submit">
                {submitting ? copy.loginSubmitting : copy.login}
              </button>
              {canResendVerification ? (
                <button className="ghost-button compact-button" disabled={resending} type="button" onClick={() => void handleResend()}>
                  {resending ? copy.resendVerificationSubmitting : copy.resendVerification}
                </button>
              ) : null}
            </form>
          ) : (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                void handleRegisterSubmit();
              }}
            >
              <label className="field-group">
                <span>{copy.fullName}</span>
                <input
                  autoComplete="name"
                  value={registration.full_name}
                  onChange={(event) => setRegistration((current) => ({ ...current, full_name: event.target.value }))}
                />
              </label>
              <label className="field-group">
                <span>{copy.email}</span>
                <input
                  autoComplete="email"
                  value={registration.email}
                  onChange={(event) => setRegistration((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="field-group">
                <span>{copy.password}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={registration.password}
                  onChange={(event) => setRegistration((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <label className="field-group">
                <span>{copy.confirmPassword}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={registration.confirmPassword}
                  onChange={(event) => setRegistration((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
              </label>
              <button className="action-button" disabled={submitting} type="submit">
                {submitting ? copy.registerSubmitting : copy.register}
              </button>
            </form>
          )}
        </section>
      </main>
    );
  }

  const blockCount = site.sections.reduce((total, section) => total + section.blocks.length, 0);

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <p className="eyebrow">{copy.account}</p>
        <h2>{pickText(site.site_title, locale)}</h2>
      </section>

      <section className="panel account-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">{copy.liveEditor}</p>
            <h3>{copy.openLiveEditor}</h3>
          </div>
          <button className="action-button" onClick={onOpenEditor}>
            {copy.openLiveEditor}
          </button>
        </div>
        <div className="metric-grid metric-grid-wide">
          <MetricCard title={copy.signedInAs} value={session.full_name ?? session.email ?? "editor"} detail={session.email ?? copy.account} />
          <MetricCard title={copy.sectionCount} value={`${site.sections.length}`} detail={copy.catalogMetric} />
          <MetricCard title={copy.blockCount} value={`${blockCount}`} detail={copy.storyMetric} />
          <MetricCard title={copy.totalChanges} value={`${site.change_logs.length}`} detail={copy.activityMetric} />
        </div>
      </section>
    </main>
  );
}
