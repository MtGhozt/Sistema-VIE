import { useEffect, useState } from "react";
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
  IconPanelLeft,
  IconShield,
  NavIcon,
} from "../icons";
import { useContrast } from "../../a11y/ContrastContext";
import { ContrastToggle } from "../a11y/ContrastToggle";
import { TecLogo } from "../TecLogo";
import { NotificationBell } from "./NotificationBell";

const SIDEBAR_KEY = "vie-sidebar-collapsed";

export function AppShell() {
  const { session, logout, setViewRole, isAdminSession } = useAuth();
  const { unreadCount } = useNotifications();
  const { highContrast } = useContrast();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  if (!session) return null;

  const viewRole = session.viewRole;
  const roleDef = getRole(viewRole);
  const personName = session.name;
  const personTitle = isAdminSession
    ? session.roleName
    : getRole(viewRole).short;
  const allowed = ROUTES_BY_ROLE[isAdminSession ? "admin" : viewRole];
  const nav = NAV_ITEMS.filter((item) => allowed.includes(item.to));

  function toggleSidebar() {
    setSidebarCollapsed((c) => !c);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div
      className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
      data-sidebar-state={sidebarCollapsed ? "collapsed" : "expanded"}
    >
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>

      <aside className="sidebar" aria-label="Menú lateral">
        <div className="brand-block brand-block-tec">
          <TecLogo variant="blanco" />
          <div className="brand-copy">
            <strong>Vicerrectoría de Investigación</strong>
            <span>Fondos de Investigación</span>
          </div>
        </div>

        <nav id="sidebar-nav" className="sidebar-nav" aria-label="Principal">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <NavIcon name={icon} />
              <span className="nav-item-label">{label}</span>
              {to === "/notificaciones" && unreadCount > 0 && (
                <>
                  <span className="nav-counter" aria-hidden>
                    {unreadCount}
                  </span>
                  <span className="sr-only">{unreadCount} sin leer</span>
                </>
              )}
            </NavLink>
          ))}
          {isAdminSession && (
            <NavLink
              to="/administracion"
              title="Administración"
              className={({ isActive }) =>
                `nav-item${isActive ? " active" : ""}`
              }
            >
              <NavIcon name="settings" />
              <span className="nav-item-label">Administración</span>
            </NavLink>
          )}
        </nav>

        <footer className="sidebar-footer">
          <div className="security-note">
            <IconShield size={15} />
            <span className="nav-item-label">Prototipo académico · TEC</span>
          </div>
          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <IconLogout size={18} />
            <span className="nav-item-label">Cerrar sesión</span>
          </button>
          <div className="copyright-note">© 2026 ITCR Costa Rica</div>
        </footer>

        {/* Rail: franja al borde, como SidebarRail de shadcn */}
        <button
          type="button"
          className="sidebar-rail"
          aria-label={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          tabIndex={-1}
          onClick={toggleSidebar}
        />
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              type="button"
              className="sidebar-trigger"
              aria-expanded={!sidebarCollapsed}
              aria-controls="sidebar-nav"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            >
              <IconPanelLeft size={18} aria-hidden />
              <span className="sr-only">
                {sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
              </span>
            </button>
            <div className="topbar-product">
              <strong>Fondos VIE</strong>
              <span className="topbar-divider" />
              <span>Sistema de Gestión de Propuestas</span>
            </div>
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
        <main
          className="content"
          id="contenido"
          tabIndex={-1}
          aria-label="Contenido principal"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
