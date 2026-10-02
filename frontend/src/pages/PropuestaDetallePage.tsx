import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  enviarPropuesta,
  fetchPropuesta,
  patchPropuesta,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import { MODALIDADES } from "../data/demo";

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    enviada: "Enviada",
  };
  return map[estado] ?? estado;
}

export function PropuestaDetallePage() {
  const { id } = useParams();
  const proposalId = Number(id);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<PropuestaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEdit =
    (session?.role === "investigador" || session?.role === "admin") &&
    detail?.estadoActual === "borrador";

  useEffect(() => {
    if (!Number.isFinite(proposalId)) return;
    void (async () => {
      setLoading(true);
      try {
        setDetail(await fetchPropuesta(proposalId));
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [proposalId, navigate, showToast]);

  async function saveDraft() {
    if (!detail || !canEdit) return;
    setSaving(true);
    try {
      const updated = await patchPropuesta(detail.id, {
        titulo: detail.titulo,
        modalidad: detail.modalidadLabel,
        resumen: detail.resumen ?? undefined,
        abstractEn: detail.abstractEn ?? undefined,
        keywordsEs: detail.keywordsEs.join(", "),
        keywordsEn: detail.keywordsEn.join(", "),
      });
      setDetail(updated);
      showToast("Cambios guardados", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onEnviar() {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await enviarPropuesta(detail.id);
      setDetail(updated);
      showToast("Propuesta enviada a revisión", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al enviar", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !detail) {
    return (
      <section className="card">
        <p>Cargando expediente…</p>
      </section>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{detail.codigo}</span>
      </div>
      <header className="page-header">
        <div>
          <p className="eyebrow">{detail.codigo}</p>
          <h1>{detail.titulo}</h1>
          <p>
            {detail.convocatoriaNombre} · {detail.escuelaNombre}
          </p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas" className="btn btn-secondary">
            Volver
          </Link>
          {canEdit && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving}
                onClick={() => void saveDraft()}
              >
                Guardar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => void onEnviar()}
              >
                Enviar a revisión
              </button>
            </>
          )}
        </div>
      </header>

      <section className="card proposal-status-card">
        <div className="proposal-status-head">
          <div>
            <span>Estado</span>
            <strong>{labelEstado(detail.estadoActual)}</strong>
          </div>
          <div>
            <span>Modalidad</span>
            <strong>{detail.modalidadLabel}</strong>
          </div>
          <div>
            <span>Coordinación</span>
            <strong>{detail.coordinadorNombre}</strong>
          </div>
          <div>
            <span>Envío</span>
            <strong>
              {detail.fechaEnvio
                ? new Date(detail.fechaEnvio).toLocaleString("es-CR")
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section className="card stack-lg" style={{ marginTop: 18 }}>
        <h2>Datos del borrador</h2>
        {canEdit ? (
          <div className="stack-md">
            <label className="field">
              <span className="field-label">Título</span>
              <input
                className="input"
                value={detail.titulo}
                onChange={(e) =>
                  setDetail({ ...detail, titulo: e.target.value })
                }
              />
            </label>
            <fieldset className="field">
              <legend className="field-label">Modalidad</legend>
              <div className="choice-row" style={{ marginLeft: 0 }}>
                {MODALIDADES.map((m) => (
                  <label
                    key={m}
                    className={`radio-choice${detail.modalidadLabel === m ? " selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="modalidad-edit"
                      checked={detail.modalidadLabel === m}
                      onChange={() =>
                        setDetail({ ...detail, modalidadLabel: m })
                      }
                    />
                    <span className="radio-dot" />
                    {m}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span className="field-label">Resumen (ES)</span>
              <textarea
                className="input textarea"
                rows={4}
                value={detail.resumen ?? ""}
                onChange={(e) =>
                  setDetail({ ...detail, resumen: e.target.value })
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Abstract (EN)</span>
              <textarea
                className="input textarea"
                rows={4}
                value={detail.abstractEn ?? ""}
                onChange={(e) =>
                  setDetail({ ...detail, abstractEn: e.target.value })
                }
              />
            </label>
            <div className="form-grid two-col">
              <label className="field">
                <span className="field-label">Palabras clave (ES)</span>
                <input
                  className="input"
                  value={detail.keywordsEs.join(", ")}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      keywordsEs: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Keywords (EN)</span>
                <input
                  className="input"
                  value={detail.keywordsEn.join(", ")}
                  onChange={(e) =>
                    setDetail({
                      ...detail,
                      keywordsEn: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="stack-md">
            <p>{detail.resumen || "Sin resumen"}</p>
            <p>{detail.abstractEn || "No abstract"}</p>
            <p>
              ES: {detail.keywordsEs.join(", ") || "—"} · EN:{" "}
              {detail.keywordsEn.join(", ") || "—"}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
