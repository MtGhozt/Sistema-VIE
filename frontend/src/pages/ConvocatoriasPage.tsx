import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { ApiError } from "../api/client";
import {
  createConvocatoria,
  deleteConvocatoria,
  fetchConvocatoria,
  fetchConvocatorias,
  patchConvocatoria,
  type Convocatoria,
  type ConvocatoriaDetalle,
  type ConvocatoriaHitoInput,
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

function emptyHito(): ConvocatoriaHitoInput {
  return {
    nombre: "",
    responsable: "",
    fechaInicio: "",
    fechaFin: "",
  };
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ConvocatoriaDetalle | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [apertura, setApertura] = useState("");
  const [cierre, setCierre] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [hitos, setHitos] = useState<ConvocatoriaHitoInput[]>([emptyHito()]);

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

  function resetForm() {
    setNombre("");
    setDescripcion("");
    setApertura("");
    setCierre("");
    setPresupuesto("");
    setHitos([emptyHito()]);
    setEditingId(null);
    setShowForm(false);
  }

  function updateHito(index: number, update: Partial<ConvocatoriaHitoInput>) {
    setHitos((current) =>
      current.map((hito, i) => (i === index ? { ...hito, ...update } : hito)),
    );
  }

  function startEditing(convocatoria: ConvocatoriaDetalle) {
    setNombre(convocatoria.nombre);
    setDescripcion(convocatoria.descripcion ?? "");
    setApertura(convocatoria.fechaApertura);
    setCierre(convocatoria.fechaCierre);
    setPresupuesto(
      convocatoria.presupuestoEstimado == null
        ? ""
        : String(convocatoria.presupuestoEstimado),
    );
    setHitos(
      convocatoria.hitos.length > 0
        ? convocatoria.hitos.map(
            ({ nombre, responsable, fechaInicio, fechaFin }) => ({
              nombre,
              responsable,
              fechaInicio,
              fechaFin,
            }),
          )
        : [emptyHito()],
    );
    setEditingId(convocatoria.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function openDetail(id: number) {
    setDetail(null);
    try {
      setDetail(await fetchConvocatoria(id));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo cargar el detalle";
      setError(msg);
      showToast(msg, "error");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !apertura || !cierre) return;
    if (
      hitos.some(
        (hito) =>
          !hito.nombre.trim() ||
          !hito.responsable.trim() ||
          !hito.fechaInicio ||
          !hito.fechaFin ||
          hito.fechaInicio < apertura ||
          hito.fechaFin > cierre ||
          hito.fechaFin < hito.fechaInicio,
      )
    ) {
      const msg =
        "Cada actividad debe tener sus datos completos y fechas dentro del período de la convocatoria";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input = {
        nombre: nombre.trim(),
        descripcion:
          descripcion.trim() || (editingId != null ? null : undefined),
        fechaApertura: apertura,
        fechaCierre: cierre,
        presupuestoEstimado: presupuesto
          ? Number(presupuesto)
          : null,
        hitos: hitos.map((hito) => ({
          nombre: hito.nombre.trim(),
          responsable: hito.responsable.trim(),
          fechaInicio: hito.fechaInicio,
          fechaFin: hito.fechaFin,
        })),
      };
      if (editingId != null) {
        await patchConvocatoria(editingId, input);
        showToast("Borrador de convocatoria actualizado", "success");
      } else {
        const created = await createConvocatoria({
          ...input,
          estado: "borrador",
        });
        showToast("Borrador de convocatoria guardado", "success");
        await loadList();
        resetForm();
        await openDetail(created.id);
        return;
      }
      const updatedId = editingId;
      await loadList();
      resetForm();
      if (updatedId != null) await openDetail(updatedId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
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

  async function removeDraft(id: number) {
    if (!window.confirm("¿Desea eliminar este borrador de convocatoria?")) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteConvocatoria(id);
      if (editingId === id) resetForm();
      if (detail?.id === id) setDetail(null);
      showToast("Borrador de convocatoria eliminado", "success");
      await loadList();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al eliminar borrador";
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
              onClick={() => {
                if (showForm && editingId == null) {
                  resetForm();
                } else {
                  resetForm();
                  setShowForm(true);
                }
              }}
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
          onSubmit={onSubmit}
        >
          <h2>{editingId == null ? "Nueva convocatoria" : "Editar borrador"}</h2>
          <p>
            {editingId == null
              ? "Se guarda como borrador. Agregue las actividades, responsables y fechas del cronograma."
              : "Actualice los datos y el cronograma antes de publicar."}
          </p>
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
                min={apertura || undefined}
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
          <div className="stack-md convocatoria-schedule-editor">
            <div className="section-inline">
              <div>
                <h3>Cronograma de actividades</h3>
                <p className="muted">
                  Ingrese una actividad, su responsable y el rango de fechas.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHitos((current) => [...current, emptyHito()])}
              >
                Agregar actividad
              </button>
            </div>
            {hitos.map((hito, index) => (
              <div className="schedule-box" key={index}>
                <div className="form-grid two-col">
                  <label className="field" style={{ gridColumn: "1 / -1" }}>
                    <span className="field-label">Actividad</span>
                    <input
                      className="input"
                      maxLength={200}
                      value={hito.nombre}
                      onChange={(e) => updateHito(index, { nombre: e.target.value })}
                      required
                    />
                  </label>
                  <label className="field" style={{ gridColumn: "1 / -1" }}>
                    <span className="field-label">Responsable</span>
                    <input
                      className="input"
                      maxLength={120}
                      value={hito.responsable}
                      onChange={(e) =>
                        updateHito(index, { responsable: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Fecha de inicio</span>
                    <input
                      className="input"
                      type="date"
                      min={apertura || undefined}
                      max={cierre || undefined}
                      value={hito.fechaInicio}
                      onChange={(e) =>
                        updateHito(index, { fechaInicio: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Fecha de fin</span>
                    <input
                      className="input"
                      type="date"
                      min={hito.fechaInicio || apertura || undefined}
                      max={cierre || undefined}
                      value={hito.fechaFin}
                      onChange={(e) =>
                        updateHito(index, { fechaFin: e.target.value })
                      }
                      required
                    />
                  </label>
                  {hitos.length > 1 && (
                    <div className="page-actions" style={{ gridColumn: "1 / -1" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          setHitos((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Eliminar actividad
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="page-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Guardando…"
                : editingId == null
                  ? "Guardar borrador"
                  : "Guardar cambios"}
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
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => startEditing(detail)}
                  >
                    Editar borrador
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={saving}
                    onClick={() => void removeDraft(detail.id)}
                  >
                    Eliminar borrador
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void changeEstado(detail.id, "activa")}
                  >
                    Publicar
                  </button>
                </>
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
