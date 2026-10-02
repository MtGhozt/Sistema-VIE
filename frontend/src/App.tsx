import { useEffect, useState, type FormEvent } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Health = { status: string; database?: string; message?: string };
type RoleRow = {
  codigo: string;
  nombre: string;
  correo_institucional: string;
  nombre_completo: string;
};

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState("");
  const [session, setSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/health`)
      .then(async (r) => setHealth(await r.json()))
      .catch(() =>
        setHealth({ status: "error", message: "No se pudo conectar al backend" }),
      );

    fetch(`${API}/api/demo/roles`)
      .then(async (r) => {
        if (!r.ok) throw new Error("roles");
        setRoles(await r.json());
      })
      .catch(() => setRoles([]));
  }, []);

  async function loginDemo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const r = await fetch(`${API}/api/demo/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleCode: selected }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Login falló");
      setSession(`${data.user.name} · ${data.user.roleName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de login");
    }
  }

  const dbOk = health?.status === "ok";

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="brand">Tecnológico de Costa Rica · VIE</p>
          <h1>Sistema VIE</h1>
          <p className="muted">Prototipo funcional — Fase 0 (cimiento)</p>
        </div>
        <div className={`pill ${dbOk ? "ok" : "bad"}`} aria-live="polite">
          API: {health?.status ?? "…"}
          {health?.database ? ` · BD ${health.database}` : ""}
        </div>
      </header>

      <main>
        <section className="card" aria-labelledby="login-title">
          <h2 id="login-title">Login demo por rol</h2>
          <p className="muted">
            Sin contraseña real (decisión D13). Elegí un rol seed y entrás.
          </p>
          <form onSubmit={loginDemo} className="form">
            <label htmlFor="role">Rol</label>
            <select
              id="role"
              required
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="" disabled>
                Seleccionar…
              </option>
              {roles.map((r) => (
                <option key={r.codigo} value={r.codigo}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!selected}>
              Entrar (demo)
            </button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {session && (
            <p className="ok-text" role="status">
              Sesión: {session}
            </p>
          )}
        </section>

        <section className="card">
          <h2>Siguiente</h2>
          <ul>
            <li>
              Referencia UI:{" "}
              <code>frontend/reference/Fondos-VIE-Prototipo.html</code>
            </li>
            <li>
              Plan: <code>PLAN-MAESTRO.md</code> · CU1 convocatoria
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
