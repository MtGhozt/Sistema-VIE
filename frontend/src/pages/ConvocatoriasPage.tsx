import { ConvocatoriaEditor } from "../components/ConvocatoriaEditor";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import {
  createConvocatoria,
  fetchConvocatoria,
  fetchConvocatorias,
  patchConvocatoria,
  type Convocatoria,
  type ConvocatoriaDetalle,
  type ConvocatoriaHito,
} from "../api/convocatorias";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = value.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    activa: "Publicada",
    cerrada: "Cerrada",
    finalizada: "Finalizada",
  };
  return map[estado] ?? estado;
}

export function ConvocatoriasPage() {
  const { session, isAdminSession } = useAuth();
  const { showToast } = useToast();
  const canPublish =
    session?.role === "vie_publicacion" ||
    session?.role === "admin" ||
    (isAdminSession && session?.viewRole === "vie_publicacion");

  const [rows, setRows] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId,setEditingId] = useState<number|null>(null);
  const [detail, setDetail] = useState<ConvocatoriaDetalle | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [apertura, setApertura] = useState("");
  const [cierre, setCierre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConvocatorias();
      setRows(data);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudieron cargar convocatorias";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function openDetail(id: number) {
    setDetail(null);
    setEditingId(null);
    try {
      setDetail(await fetchConvocatoria(id));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo cargar el detalle";
      setError(msg);
      showToast(msg, "error");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !apertura || !cierre) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createConvocatoria({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaApertura: apertura,
        fechaCierre: cierre,
        presupuestoEstimado: presupuesto
          ? Number(presupuesto)
          : null,
        estado: "borrador",
        hitos: [
          {
            nombre: "Recepción de propuestas",
            responsable: "VIE",
            fechaInicio: apertura,
            fechaFin: cierre,
          },
        ],
      });
      setNombre("");
      setDescripcion("");
      setApertura("");
      setCierre("");
      setPresupuesto("");
      setShowForm(false);
      showToast("Borrador de convocatoria guardado", "success");
      await loadList();
      await openDetail(created.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function changeEstado(
    id: number,
    estado: "activa" | "cerrada" | "borrador",
  ) {
    setSaving(true);
    setError(null);
    try {
      await patchConvocatoria(id, { estado });
      const messages = {
        activa: "Convocatoria publicada",
        cerrada: "Convocatoria cerrada",
        borrador: "Convocatoria vuelta a borrador",
      } as const;
      showToast(messages[estado], "success");
      await loadList();
      if (detail?.id === id) await openDetail(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">VIE · Publicación</p>
          <h1>Gestión de convocatorias</h1>
          <p>
            Publique, administre el cronograma y consulte convocatorias vigentes
            e históricas (roles VIE Publicación / admin).
          </p>
        </div>
        {canPublish && (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              Nueva convocatoria
            </button>
          </div>
        )}
      </header>

      {/* Región live siempre montada: si el mensaje llega con el nodo, el
          lector de pantalla puede no anunciarlo (WCAG 4.1.3). */}
      <div role="alert" aria-live="assertive">
        {error && (
          <p className="field-error-text" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
      </div>

      {showForm && canPublish && (
        <form
          className="card stack-md"
          style={{ marginBottom: 18 }}
          onSubmit={onCreate}
        >
          <h2>Nueva convocatoria</h2>
          <p>Se guarda como borrador (incluye un hito inicial).</p>
          <div className="form-grid two-col">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span className="field-label">Nombre</span>
              <input
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span className="field-label">Descripción</span>
              <textarea
                className="input textarea"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Apertura</span>
              <input
                className="input"
                type="date"
                value={apertura}
                onChange={(e) => setApertura(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Cierre</span>
              <input
                className="input"
                type="date"
                value={cierre}
                onChange={(e) => setCierre(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Presupuesto estimado (₡)</span>
              <input
                className="input"
                type="number"
                min={0}
                max={999999999999.99}
                step={1000}
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
              />
            </label>
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
          </div>
        </form>
      )}

      <section className="card convocatorias-list">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Convocatoria</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Estado</th>
                <th>Propuestas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7}>Cargando…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7}>No hay convocatorias registradas.</td>
                </tr>
              )}
              {rows.map((c) => (
                <tr key={c.id} className="clickable">
                  <td>VIE-{c.id}</td>
                  <td className="table-primary">
                    <strong>{c.nombre}</strong>
                    {c.descripcion && <span>{c.descripcion.slice(0, 80)}</span>}
                  </td>
                  <td>{formatDate(c.fechaApertura)}</td>
                  <td>{formatDate(c.fechaCierre)}</td>
                  <td>
                    <span className="badge badge-primary">
                      {labelEstado(c.estado)}
                    </span>
                  </td>
                  <td>{c.propuestasCount}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void openDetail(c.id)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <section
          className="card stack-md convocatoria-detail"
          style={{ marginTop: 18 }}
        >
          <div className="section-inline">
            <div>
              <p className="eyebrow">Detalle · VIE-{detail.id}</p>
              <h2>{detail.nombre}</h2>
              <p>{detail.descripcion || "Sin descripción"}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetail(null)}
            >
              Cerrar
            </button>
          </div>

          {canPublish && <button type="button" className="btn btn-secondary" onClick={()=>setEditingId(detail.id)}>Editar convocatoria</button>}
          {canPublish && editingId===detail.id && <ConvocatoriaEditor key={detail.id} value={detail} onCancel={()=>setEditingId(null)} onSaved={()=>{setEditingId(null);showToast("Convocatoria y cronograma guardados","success");void loadList();void openDetail(detail.id);}}/>}
          <div className="detail-grid">
            <div>
              <span>Estado</span>
              <strong>{labelEstado(detail.estado)}</strong>
            </div>
            <div>
              <span>Apertura</span>
              <strong>{formatDate(detail.fechaApertura)}</strong>
            </div>
            <div>
              <span>Cierre</span>
              <strong>{formatDate(detail.fechaCierre)}</strong>
            </div>
            <div>
              <span>Presupuesto estimado</span>
              <strong>
                {detail.presupuestoEstimado != null
                  ? `₡${detail.presupuestoEstimado.toLocaleString("es-CR")}`
                  : "—"}
              </strong>
            </div>
          </div>

          {canPublish && (
            <div className="action-row">
              {detail.estado === "borrador" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={() => void changeEstado(detail.id, "activa")}
                >
                  Publicar
                </button>
              )}
              {detail.estado === "activa" && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={saving}
                  onClick={() => void changeEstado(detail.id, "cerrada")}
                >
                  Cerrar convocatoria
                </button>
              )}
              {detail.estado === "cerrada" && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={saving}
                  onClick={() => void changeEstado(detail.id, "activa")}
                >
                  Reactivar
                </button>
              )}
            </div>
          )}

          <div>
            <h3>Cronograma (hitos)</h3>
            {detail.hitos.length === 0 ? (
              <p className="muted">Sin hitos registrados.</p>
            ) : (
              <div className="schedule-box">
                {detail.hitos.map((h: ConvocatoriaHito) => (
                  <div key={h.id} className="schedule-row">
                    <span>
                      <strong>{h.nombre}</strong> · {h.responsable}
                    </span>
                    <span>
                      {formatDate(h.fechaInicio)} – {formatDate(h.fechaFin)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
