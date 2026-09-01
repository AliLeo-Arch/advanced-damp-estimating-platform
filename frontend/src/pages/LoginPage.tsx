import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingButton } from "../components/Loading";
import { loginRequest, storeSession } from "../auth";

type LoginPageProps = {
  onSignedIn?: () => void;
};

export default function LoginPage({ onSignedIn }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("james.whitaker@advanceddamp.co.uk");
  const [password, setPassword] = useState("Surveyor1!");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-card panel">
        <header className="login-card-header">
          <h1 className="login-title" id="login-title">
            Sign in
          </h1>
          <p className="login-lead">
            Local production access for Advanced Damp estimating users.
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
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
      </div>

      <p className="login-hint muted">
        Demo: surveyor <code>james.whitaker@advanceddamp.co.uk</code> /{" "}
        <code>Surveyor1!</code>
        {" · "}
        owner <code>owner@advanceddamp.co.uk</code> / <code>OwnerDamp1!</code>
      </p>
    </section>
  );
}
