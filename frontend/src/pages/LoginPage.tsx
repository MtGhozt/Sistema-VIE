import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
} from "../components/icons";
import { ROLES, type RoleId } from "../data/roles";

export function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@tec.ac.cr");
  const [password, setPassword] = useState("prototipo2026");
  const [role, setRole] = useState<RoleId>("admin");
  const [showPassword, setShowPassword] = useState(false);

  if (session) {
    return <Navigate to="/inicio" replace />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    login(email, role);
    navigate("/inicio", { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-copy">
          <div className="login-tec-lockup">
            <span>TEC</span>
            <i />
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

      <div className="login-form-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-form-title">
            <span className="eyebrow">Acceso institucional</span>
            <h2>Iniciar sesión</h2>
            <p>
              Utilice sus credenciales institucionales para ingresar al
              prototipo.
            </p>
          </div>

          <label className="field">
            <span className="field-label">Correo institucional</span>
            <div className="input-icon-wrap">
              <IconMail size={17} />
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Contraseña</span>
            <div className="input-icon-wrap">
              <IconLock size={17} />
              <input
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
                Permite recorrer los distintos actores sin integración con
                cuentas reales del TEC.
              </span>
            </div>
            <label className="field">
              <span className="field-label">Rol</span>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleId)}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" className="btn btn-primary full-width">
            Iniciar sesión
          </button>
          <p className="login-help">
            El prototipo no se integra con Orión ni con otros sistemas reales
            del TEC. La sesión se guarda en localStorage (sin backend aún).
          </p>
        </form>
      </div>
    </div>
  );
}
