import { useState } from "react";
import { CONVOCATORIAS } from "../data/demo";
import { useAuth } from "../auth/AuthContext";

export function ConvocatoriasPage() {
  const { session } = useAuth();
  const canPublish =
    session?.viewRole === "vie_publicacion" || session?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState(CONVOCATORIAS);
  const [nombre, setNombre] = useState("");
  const [apertura, setApertura] = useState("");
  const [cierre, setCierre] = useState("");

  function addConvocatoria() {
    if (!nombre.trim()) return;
    setRows((prev) => [
      {
        id: `VIE-DRAFT-${prev.length + 1}`,
        nombre: nombre.trim(),
        apertura: apertura || "—",
        cierre: cierre || "—",
        estado: "Borrador",
        propuestas: 0,
      },
      ...prev,
    ]);
    setNombre("");
    setApertura("");
    setCierre("");
    setShowForm(false);
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Convocatorias</p>
          <h1>Gestión de convocatorias</h1>
          <p>
            Consultá convocatorias vigentes e históricas. Los borradores viven
            en el navegador hasta conectar el backend (CU1).
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

      {showForm && canPublish && (
        <section className="card stack-md" style={{ marginBottom: 18 }}>
          <h2>Nueva convocatoria</h2>
          <p>Defina la información principal y el periodo de recepción.</p>
          <div className="form-grid two-col">
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span className="field-label">Nombre</span>
              <input
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Apertura</span>
              <input
                className="input"
                type="date"
                value={apertura}
                onChange={(e) => setApertura(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Cierre</span>
              <input
                className="input"
                type="date"
                value={cierre}
                onChange={(e) => setCierre(e.target.value)}
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
              type="button"
              className="btn btn-primary"
              onClick={addConvocatoria}
            >
              Guardar borrador
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Convocatoria</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Estado</th>
                <th>Propuestas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td className="table-primary">
                    <strong>{c.nombre}</strong>
                  </td>
                  <td>{c.apertura}</td>
                  <td>{c.cierre}</td>
                  <td>
                    <span className="badge badge-primary">{c.estado}</span>
                  </td>
                  <td>{c.propuestas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
