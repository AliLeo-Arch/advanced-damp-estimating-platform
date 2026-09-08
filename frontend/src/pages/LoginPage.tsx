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
      <div className="login-card panel">
        <header className="login-card-header">
          <h1 className="login-title" id="login-title">
            Sign in
          </h1>
          <p className="login-lead">
            Access Trade Estimating & Quoting with your organisation account.
          </p>
        </header>

        {error ? <div className="error-banner login-error">{error}</div> : null}

        <form className="login-form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                className="btn btn-secondary password-toggle"
                type="button"
                onClick={() => setShowPassword((open) => !open)}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
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
              {demoOpen ? "Hide demo accounts" : "Demo accounts"}
            </button>
            {demoOpen ? (
              <ul className="demo-accounts-list">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email}>
                    <div>
                      <strong>{account.role}</strong>
                      <div className="muted">
                        <code>{account.email}</code>
                        {" / "}
                        <code>{account.password}</code>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
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
      </div>

      {modeReady && !demoHelpers ? (
        <p className="login-hint muted">
          Contact your system administrator if you cannot sign in.
        </p>
      ) : null}
    </section>
  );
}
