import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useNotifications } from "../../notifications/NotificationsContext";
import {
  NAV_ITEMS,
  ROLES,
  ROUTES_BY_ROLE,
  getRole,
  type RoleId,
} from "../../data/roles";
import {
  IconLogout,
  IconShield,
  NavIcon,
} from "../icons";
import { useContrast } from "../../a11y/ContrastContext";
import { ContrastToggle } from "../a11y/ContrastToggle";
import { TecLogo } from "../TecLogo";
import { NotificationBell } from "./NotificationBell";

export function AppShell() {
  const { session, logout, setViewRole, isAdminSession } = useAuth();
  const { unreadCount } = useNotifications();
  const { highContrast } = useContrast();
  const navigate = useNavigate();

  if (!session) return null;

  const viewRole = session.viewRole;
  const roleDef = getRole(viewRole);
  const personName = session.name;
  const personTitle = isAdminSession
    ? session.roleName
    : getRole(viewRole).short;
  const allowed = ROUTES_BY_ROLE[isAdminSession ? "admin" : viewRole];
  const nav = NAV_ITEMS.filter((item) => allowed.includes(item.to));

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>
      <aside className="sidebar">
        <div className="brand-block brand-block-tec">
          <TecLogo variant="blanco" />
          <div className="brand-copy">
            <strong>Vicerrectoría de Investigación</strong>
            <span>Fondos de Investigación</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Principal">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <NavIcon name={icon} />
              <span>{label}</span>
              {to === "/notificaciones" && unreadCount > 0 && (
                <span className="nav-counter">{unreadCount}</span>
              )}
            </NavLink>
          ))}
          {isAdminSession && (
            <NavLink
              to="/administracion"
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <NavIcon name="settings" />
              <span>Administración</span>
            </NavLink>
          )}
        </nav>

        <footer className="sidebar-footer">
          <div className="security-note">
            <IconShield size={15} /> Prototipo académico · TEC
          </div>
          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
          >
            <IconLogout size={18} />
            <span>Cerrar sesión</span>
          </button>
          <div className="copyright-note">© 2026 ITCR Costa Rica</div>
        </footer>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-product">
            <strong>Fondos VIE</strong>
            <span className="topbar-divider" />
            <span>Sistema de Gestión de Propuestas</span>
          </div>
          <div className="topbar-actions">
            {isAdminSession && (
              <label className="admin-role-switch">
                <span>Vista actual</span>
                <select
                  value={viewRole === "admin" ? "admin" : viewRole}
                  onChange={(e) => setViewRole(e.target.value as RoleId)}
                  aria-label="Cambiar vista de rol"
                >
                  {ROLES.filter((r) => r.id !== "admin").map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.short}
                    </option>
                  ))}
                  <option value="admin">Super Admin</option>
                </select>
              </label>
            )}
            <ContrastToggle compact />
            <div className="current-role-chip">
              <span>Rol</span>
              <strong>{roleDef.short}</strong>
            </div>
            <NotificationBell />
            <div className="user-chip">
              <div className="avatar" aria-hidden>
                {personName.slice(0, 1)}
              </div>
              <div>
                <strong>{personName}</strong>
                <span>{personTitle}</span>
              </div>
            </div>
          </div>
        </header>
        <div
          className="contrast-announce"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {highContrast
            ? "Alto contraste activado"
            : "Alto contraste desactivado"}
        </div>
        <main className="content" id="contenido" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
