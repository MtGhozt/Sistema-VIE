import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchDemoRoles, fetchHealth, type DemoRoleRow } from "../api/demoAuth";
import { useAuth } from "../auth/AuthContext";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "../components/icons";
import { TecLogo } from "../components/TecLogo";
import { useToast } from "../components/toast/ToastContext";
import { isRoleId, type RoleId } from "../data/roles";

export function LoginPage() {
  const { session, loginWithRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<DemoRoleRow[]>([]);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("prototipo2026");
  const [role, setRole] = useState<RoleId>("investigador");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await fetchHealth();
        if (!cancelled) setApiOk(health.status === "ok");
      } catch {
        if (!cancelled) setApiOk(false);
      }
      try {
        const rows = await fetchDemoRoles();
        if (cancelled) return;
        setRoles(rows);
        setRolesError(null);
        const first = rows[0];
        if (first && isRoleId(first.codigo)) {
          setRole(first.codigo);
          setEmail(first.correo_institucional);
        }
      } catch (err) {
        if (!cancelled) {
          setRolesError(
            err instanceof Error ? err.message : "No se pudieron cargar roles",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (session) {
    return <Navigate to="/inicio" replace />;
  }

  function onRoleChange(next: string) {
    if (!isRoleId(next)) return;
    setRole(next);
    const row = roles.find((r) => r.codigo === next);
    if (row) setEmail(row.correo_institucional);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setSubmitting(true);
    try {
      await loginWithRole(role);
      showToast("Sesión iniciada", "success");
      navigate("/inicio", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Error al iniciar sesión";
      setLoginError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const roleOptions =
    roles.length > 0
      ? roles.filter((r) => isRoleId(r.codigo))
      : [];

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-copy">
          <div className="login-tec-lockup">
            <TecLogo variant="blanco" className="login-tec-logo" />
          </div>
          <div className="eyebrow light">
            Instituto Tecnológico de Costa Rica
          </div>
          <h1>Gestión de Propuestas de Investigación</h1>
          <p>
            Prototipo institucional para la formulación, evaluación, resolución
            y consulta histórica de propuestas de Fondos VIE.
          </p>
          <div className="login-stage-list">
            <span>Redacción estructurada</span>
            <span>Evaluación basada en roles</span>
            <span>Trazabilidad del expediente</span>
          </div>
        </div>
        <div className="login-footer">
          Vicerrectoría de Investigación y Extensión · Prototipo académico
        </div>
      </div>

      <main className="login-form-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-form-title">
            <span className="eyebrow">Acceso institucional</span>
            <h2>Iniciar sesión</h2>
            <p>
              Utilice sus credenciales institucionales para ingresar al
              prototipo.
            </p>
          </div>

          {/* Las regiones live existen siempre en el DOM: si se montan junto
              con el mensaje, el lector de pantalla puede no anunciarlo. */}
          <div role="alert" aria-live="assertive">
            {apiOk === false && (
              <p className="field-error-text">
                No hay conexión con la API. Desde la raíz:{" "}
                <code>pnpm db:up</code> y <code>pnpm dev</code>.
              </p>
            )}
          </div>
          <div role="status" aria-live="polite">
            {apiOk === true && (
              <p className="field-hint">API conectada · login demo por rol</p>
            )}
          </div>

          <label className="field" htmlFor="login-correo">
            <span className="field-label">Correo institucional</span>
            <div className="input-icon-wrap">
              <IconMail size={17} />
              <input
                id="login-correo"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </label>

          <label className="field" htmlFor="login-contrasena">
            <span className="field-label">Contraseña</span>
            <div className="input-icon-wrap">
              <IconLock size={17} />
              <input
                id="login-contrasena"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? <IconEyeOff size={17} /> : <IconEye size={17} />}
              </button>
            </div>
          </label>

          <div className="prototype-role-box">
            <div>
              <strong>Perfil de demostración</strong>
              <span>
                Roles cargados desde <code>/api/demo/roles</code>. La contraseña
                no se valida (D13).
              </span>
            </div>
            <label className="field">
              <span className="field-label">Rol</span>
              <select
                className="input"
                value={role}
                disabled={roleOptions.length === 0}
                onChange={(e) => onRoleChange(e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </label>
            {rolesError && (
              <p className="field-error-text" role="alert">
                {rolesError}
              </p>
            )}
          </div>

          {loginError && (
            <p className="field-error-text" role="alert">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary full-width"
            disabled={submitting || roleOptions.length === 0}
          >
            {submitting ? "Ingresando…" : "Iniciar sesión"}
          </button>
          <p className="login-help">
            El prototipo no se integra con Orión. Tras login, la sesión queda en
            el navegador con datos del usuario seed en Postgres.
          </p>
        </form>
      </main>
    </div>
  );
}
