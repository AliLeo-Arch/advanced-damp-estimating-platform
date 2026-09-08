import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHealth } from "../api";
import { LoadingButton } from "../components/Loading";
import { loginRequest, storeSession } from "../auth";

type LoginPageProps = {
  onSignedIn?: () => void;
};

const DEMO_ACCOUNTS = [
  {
    role: "Surveyor",
    email: "james.whitaker@northbridge-demo.example",
    password: "Surveyor1!",
  },
  {
    role: "Owner",
    email: "owner@northbridge-demo.example",
    password: "DemoOwner1!",
  },
  {
    role: "Admin",
    email: "admin@northbridge-demo.example",
    password: "DemoAdmin1!",
  },
] as const;

function resolveDemoHelpers(
  healthFlag: boolean | undefined,
  envFlag: string | undefined,
): boolean {
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return Boolean(healthFlag);
}

export default function LoginPage({ onSignedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [demoHelpers, setDemoHelpers] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [modeReady, setModeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getHealth()
      .then((health) => {
        if (cancelled) return;
        const enabled = resolveDemoHelpers(
          health.demo_helpers,
          import.meta.env.VITE_SHOW_DEMO_CREDENTIALS,
        );
        setDemoHelpers(enabled);
        if (enabled) {
          setEmail(DEMO_ACCOUNTS[0].email);
          setPassword(DEMO_ACCOUNTS[0].password);
          setDemoOpen(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const enabled = resolveDemoHelpers(
          undefined,
          import.meta.env.VITE_SHOW_DEMO_CREDENTIALS,
        );
        setDemoHelpers(enabled);
      })
      .finally(() => {
        if (!cancelled) setModeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await loginRequest(email.trim(), password);
      storeSession(result.access_token, result.user);
      onSignedIn?.();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  function useDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  }

  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-shell">
        <aside className="login-brand" aria-label="Product">
          <div className="login-brand-glow" aria-hidden />
          <img
            className="login-brand-mark"
            src="/brand/trade-estimating-mark.svg"
            alt=""
            width={72}
            height={72}
          />
          <p className="login-brand-name">Trade Estimating</p>
          <p className="login-brand-tag">Quoting for specialist contractors</p>
          <ul className="login-brand-points">
            <li>Structured estimates from survey to quotation</li>
            <li>Margin-controlled commercial pricing</li>
            <li>Job actuals against quoted cost</li>
          </ul>
        </aside>

        <div className="login-panel">
          <header className="login-card-header">
            <p className="login-kicker">Organisation sign-in</p>
            <h1 className="login-title" id="login-title">
              Welcome back
            </h1>
            <p className="login-lead">
              Sign in with your work email to continue estimating and quoting.
            </p>
          </header>

          {error ? (
            <div className="error-banner login-error" role="alert">
              {error}
            </div>
          ) : null}

          <form className="login-form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.example"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="password-toggle-icon"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.9 5.2A10.4 10.4 0 0 1 12 5c5.5 0 9.3 4.4 10.5 6.2a1.5 1.5 0 0 1 0 1.6c-.4.6-1.3 1.8-2.7 3M6.1 6.1C4.3 7.4 3 9.1 2.5 10.2a1.5 1.5 0 0 0 0 1.6C3.7 13.6 7.5 18 12 18c1.2 0 2.3-.3 3.3-.7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="password-toggle-icon"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.5 12S6.5 6 12 6s9.5 6 9.5 6-4 6-9.5 6S2.5 12 2.5 12Z"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <LoadingButton
              className="btn btn-primary login-submit"
              type="submit"
              loading={saving}
              loadingText="Signing in…"
            >
              Sign in
            </LoadingButton>
          </form>

          {modeReady && demoHelpers ? (
            <div className="demo-accounts">
              <button
                className="demo-accounts-toggle"
                type="button"
                aria-expanded={demoOpen}
                onClick={() => setDemoOpen((open) => !open)}
              >
                {demoOpen ? "Hide demo accounts" : "Use a demo account"}
              </button>
              {demoOpen ? (
                <ul className="demo-accounts-list">
                  {DEMO_ACCOUNTS.map((account) => (
                    <li key={account.email}>
                      <div>
                        <strong>{account.role}</strong>
                        <div className="muted">
                          <code>{account.email}</code>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-compact"
                        type="button"
                        onClick={() => useDemoAccount(account)}
                      >
                        Use
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {modeReady && !demoHelpers ? (
            <p className="login-hint muted">
              Contact your system administrator if you cannot sign in.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
