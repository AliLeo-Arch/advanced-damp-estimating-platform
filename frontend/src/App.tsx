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
import { CompanyProfile, getCompanyProfile } from "./api";
import { AppBootScreen } from "./components/Loading";
import UserMenu from "./components/UserMenu";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import DashboardPage from "./pages/DashboardPage";
import EstimateEditorPage from "./pages/EstimateEditorPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import RatesPage from "./pages/RatesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

const FALLBACK_COMPANY: CompanyProfile = {
  name: "Northbridge Property Services Ltd",
  phone: "0118 496 0123",
  email: "info@northbridge-demo.example",
  address: "12 Station Approach, Reading RG1 1LG",
  website: "https://www.northbridge-demo.example",
  tagline: "Specialist Trade Estimating & Quoting",
  quote_prefix: "EST",
  app_name: "Trade Estimating & Quoting",
};
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

function canManageRates(user: AuthUser | null) {
  return Boolean(user?.permissions?.includes("manage_rates"));
}

function canManageSettings(user: AuthUser | null) {
  return Boolean(user?.permissions?.includes("manage_settings"));
}

function canAdmin(user: AuthUser | null) {
  return Boolean(user?.permissions?.includes("backup"));
}

function isNavActive(pathname: string, to: string) {
  if (to === "/") {
    return pathname === "/" || pathname.startsWith("/estimates");
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function navLinkClass(pathname: string, to: string) {
  return `nav-link${isNavActive(pathname, to) ? " is-active" : ""}`;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [company, setCompany] = useState<CompanyProfile>(FALLBACK_COMPANY);

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
    let cancelled = false;
    (async () => {
      try {
        const profile = await getCompanyProfile();
        if (!cancelled) setCompany(profile);
      } catch {
        /* keep fallback branding */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
    return <AppBootScreen />;
  }

  return (
    <div
      className={`app-shell${location.pathname === "/login" ? " is-login" : ""}${
        menuOpen ? " is-menu-open" : ""
      }`}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link
            to="/"
            className="brand"
            aria-label="Trade Estimating & Quoting home"
          >
            <img
              className="brand-logo"
              src="/brand/trade-estimating-mark.svg"
              alt=""
            />
            <span className="brand-text">
              <span className="brand-mark">Trade Estimating</span>
              <span className="brand-sub">Quoting</span>
            </span>
          </Link>

          {user ? (
            <nav className="app-nav app-nav-desktop" aria-label="Primary">
              <div className="app-nav-links">
                <Link className={navLinkClass(location.pathname, "/")} to="/">
                  Estimates
                </Link>
                <Link
                  className={navLinkClass(location.pathname, "/customers")}
                  to="/customers"
                >
                  Customers
                </Link>
                <Link
                  className={navLinkClass(location.pathname, "/reports")}
                  to="/reports"
                >
                  Reports
                </Link>
                {canManageRates(user) || canManageSettings(user) || canAdmin(user) ? (
                  <span className="app-nav-divider" aria-hidden />
                ) : null}
                {canManageRates(user) ? (
                  <Link
                    className={navLinkClass(location.pathname, "/rates")}
                    to="/rates"
                  >
                    Rates
                  </Link>
                ) : null}
                {canManageSettings(user) ? (
                  <Link
                    className={navLinkClass(location.pathname, "/settings")}
                    to="/settings"
                  >
                    Settings
                  </Link>
                ) : null}
                {canAdmin(user) ? (
                  <Link
                    className={navLinkClass(location.pathname, "/admin")}
                    to="/admin"
                  >
                    Admin
                  </Link>
                ) : null}
              </div>
            </nav>
          ) : null}

          <div className="app-header-actions">
            {user ? (
              <>
                <UserMenu user={user} onSignOut={logout} />
                <Link to="/estimates/new" className="nav-cta">
                  New estimate
                </Link>
              </>
            ) : location.pathname === "/login" ? null : (
              <Link to="/login" className="nav-cta">
                Sign in
              </Link>
            )}

            {user || location.pathname !== "/login" ? (
              <button
                type="button"
                className="menu-toggle"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span
                  className={`menu-toggle-bars ${menuOpen ? "is-open" : ""}`}
                />
              </button>
            ) : (
              <span className="header-spacer" aria-hidden />
            )}
          </div>
        </div>
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
                  <span>{user.role.replaceAll("_", " ")}</span>
                </p>
                <div className="mobile-drawer-links">
                  <Link
                    className={navLinkClass(location.pathname, "/")}
                    to="/"
                    onClick={() => setMenuOpen(false)}
                  >
                    Estimates
                  </Link>
                  <Link
                    className={navLinkClass(location.pathname, "/customers")}
                    to="/customers"
                    onClick={() => setMenuOpen(false)}
                  >
                    Customers
                  </Link>
                  <Link
                    className={navLinkClass(location.pathname, "/reports")}
                    to="/reports"
                    onClick={() => setMenuOpen(false)}
                  >
                    Reports
                  </Link>
                  {canManageRates(user) ? (
                    <Link
                      className={navLinkClass(location.pathname, "/rates")}
                      to="/rates"
                      onClick={() => setMenuOpen(false)}
                    >
                      Rates
                    </Link>
                  ) : null}
                  {canManageSettings(user) ? (
                    <Link
                      className={navLinkClass(location.pathname, "/settings")}
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  ) : null}
                  {canAdmin(user) ? (
                    <Link
                      className={navLinkClass(location.pathname, "/admin")}
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  ) : null}
                </div>
                <Link
                  to="/estimates/new"
                  className="nav-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  New estimate
                </Link>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={logout}
                >
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

      <main id="main-content" className="app-main" tabIndex={-1}>
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
            path="/customers/:customerId"
            element={
              <Protected user={user}>
                <CustomerDetailPage />
              </Protected>
            }
          />
          <Route
            path="/reports"
            element={
              <Protected user={user}>
                <ReportsPage />
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
            path="/settings"
            element={
              <Protected user={user}>
                <SettingsPage />
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
          <span>© {new Date().getFullYear()} {company.name}</span>
          <span>
            <a href={`tel:${company.phone.replace(/\s+/g, "")}`}>
              {company.phone}
            </a>
            {" · "}
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
