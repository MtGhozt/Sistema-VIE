import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

export function PropuestasPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const canCreate =
    session?.role === "investigador" || session?.role === "admin";
  const [rows, setRows] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchPropuestas());
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "No se pudieron cargar las propuestas",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Propuestas · CU2</p>
          <h1>Mis propuestas</h1>
          <p>
            Borradores y envíos persistidos en PostgreSQL para la persona
            investigadora coordinadora.
          </p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <Link to="/propuestas/nueva" className="btn btn-primary">
              Crear propuesta
            </Link>
          </div>
        )}
      </header>

      <section className="recent-proposals-list">
        {loading && (
          <article className="card">
            <p>Cargando…</p>
          </article>
        )}
        {!loading && rows.length === 0 && (
          <article className="card empty-state small">
            <strong>Todavía no hay propuestas</strong>
            <span>
              {canCreate
                ? "Creá un borrador vinculado a una convocatoria activa."
                : "Ingresá como investigador para formular propuestas."}
            </span>
          </article>
        )}
        {rows.map((p) => (
          <article key={p.id} className="card proposal-dashboard-card">
            <div className="proposal-dashboard-head">
              <div>
                <span className="eyebrow">{p.codigo}</span>
                <h2>{p.titulo}</h2>
                <span>{p.convocatoriaNombre}</span>
              </div>
              <div className="proposal-dashboard-meta">
                <span className="badge badge-primary">
                  {labelEstado(p.estadoActual)}
                </span>
                <span>{p.modalidadLabel}</span>
                <Link
                  to={`/propuestas/${p.id}`}
                  className="btn btn-secondary"
                >
                  Abrir
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
