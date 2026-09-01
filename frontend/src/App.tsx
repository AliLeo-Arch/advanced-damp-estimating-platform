import { useEffect, useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthUser, clearSession, fetchSession, getStoredUser } from "./auth";
import { LoadingState } from "./components/Loading";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import EstimateEditorPage from "./pages/EstimateEditorPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RatesPage from "./pages/RatesPage";

function Protected({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  if (user) return <Navigate to="/" replace />;
  return children;
}

function canManageCommercial(user: AuthUser | null) {
  if (!user) return false;
  return (
    user.permissions.includes("manage_rates") ||
    user.permissions.includes("manage_settings")
  );
}

function canAdmin(user: AuthUser | null) {
  return Boolean(user?.permissions?.includes("backup"));
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sessionUser = await fetchSession();
      if (!cancelled) {
        setUser(sessionUser);
        setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function logout() {
    clearSession();
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  }

  if (booting) {
    return (
      <div className="app-shell app-boot">
        <LoadingState label="Starting Advanced Damp Estimating…" />
      </div>
    );
  }

  return (
    <div className={`app-shell${location.pathname === "/login" ? " is-login" : ""}`}>
      <header className="app-header">
        <Link to="/" className="brand" aria-label="Advanced Damp Estimating home">
          <img
            className="brand-logo"
            src="https://advanceddamp.co.uk/wp-content/uploads/2026/05/Advanced-Damp-1-copy.png"
            alt="Advanced Damp"
          />
          <span className="brand-text">
            <span className="brand-mark">Advanced Damp</span>
            <span className="brand-sub">Estimating</span>
          </span>
        </Link>

        <nav className="app-nav app-nav-desktop" aria-label="Primary">
          {user ? (
            <>
              <Link to="/">Estimates</Link>
              <Link to="/customers">Customers</Link>
              {canManageCommercial(user) ? <Link to="/rates">Rates</Link> : null}
              {canAdmin(user) ? <Link to="/admin">Admin</Link> : null}
              <span className="nav-user">
                {user.full_name} · {user.role}
              </span>
              <button className="btn btn-secondary" type="button" onClick={logout}>
                Sign out
              </button>
              <Link to="/estimates/new" className="nav-cta">
                New estimate
              </Link>
            </>
          ) : location.pathname === "/login" ? null : (
            <Link to="/login" className="nav-cta">
              Sign in
            </Link>
          )}
        </nav>

        {user || location.pathname !== "/login" ? (
          <button
            type="button"
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={`menu-toggle-bars ${menuOpen ? "is-open" : ""}`} />
          </button>
        ) : (
          <span className="header-spacer" aria-hidden />
        )}
      </header>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="menu-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="mobile-drawer" aria-label="Mobile">
            {user ? (
              <>
                <p className="mobile-drawer-user">
                  {user.full_name}
                  <span>{user.role}</span>
                </p>
                <Link to="/" onClick={() => setMenuOpen(false)}>
                  Estimates
                </Link>
                <Link to="/customers" onClick={() => setMenuOpen(false)}>
                  Customers
                </Link>
                {canManageCommercial(user) ? (
                  <Link to="/rates" onClick={() => setMenuOpen(false)}>
                    Rates
                  </Link>
                ) : null}
                {canAdmin(user) ? (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>
                    Admin
                  </Link>
                ) : null}
                <Link
                  to="/estimates/new"
                  className="nav-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  New estimate
                </Link>
                <button className="btn btn-secondary" type="button" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="nav-cta"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </nav>
        </>
      ) : null}

      <main className="app-main">
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly user={user}>
                <LoginPage onSignedIn={() => setUser(getStoredUser())} />
              </GuestOnly>
            }
          />
          <Route
            path="/"
            element={
              <Protected user={user}>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/customers"
            element={
              <Protected user={user}>
                <CustomersPage />
              </Protected>
            }
          />
          <Route
            path="/rates"
            element={
              <Protected user={user}>
                <RatesPage />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected user={user}>
                <AdminPage />
              </Protected>
            }
          />
          <Route
            path="/estimates/new"
            element={
              <Protected user={user}>
                <EstimateEditorPage />
              </Protected>
            }
          />
          <Route
            path="/estimates/:id"
            element={
              <Protected user={user}>
                <EstimateEditorPage />
              </Protected>
            }
          />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>Advanced Damp Ltd · Local production foundation</span>
          <span>
            <a href="tel:03003737251">0300 373 7251</a>
            {" · "}
            <a href="mailto:info@advanceddamp.co.uk">info@advanceddamp.co.uk</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
