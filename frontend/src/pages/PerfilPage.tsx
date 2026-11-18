import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  deletePerfilFoto,
  fetchPerfil,
  fetchPerfilFotoBlob,
  patchPerfil,
  uploadPerfilFoto,
  type Perfil,
} from "../api/perfil";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import { labelEstado } from "../data/proposalStates";
import { formatOrcidInput } from "../data/orcidFormat";
import { Link } from "react-router-dom";

export function PerfilPage() {
  const { session, updateSessionName } = useAuth();
  const { showToast } = useToast();
  const formId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [orcid, setOrcid] = useState("");
  const [fotoSrc, setFotoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const data = await fetchPerfil();
        if (!active) return;
        setPerfil(data);
        setNombre(data.nombre);
        setCedula(data.cedula ?? "");
        setOrcid(data.orcid ?? "");
        if (data.fotoUrl) {
          objectUrl = await fetchPerfilFotoBlob(data.id);
          if (active) setFotoSrc(objectUrl);
        }
      } catch (e) {
        if (active) showToast(e instanceof Error ? e.message : "No se pudo cargar el perfil", "error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [showToast]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await patchPerfil({ nombre, cedula, orcid });
      updateSessionName(result.nombre);
      setPerfil((p) => (p ? { ...p, nombre: result.nombre, cedula: result.cedula, orcid: result.orcid } : p));
      showToast("Perfil actualizado", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo guardar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function onFotoChange(file: File | undefined) {
    if (!file || !perfil) return;
    try {
      await uploadPerfilFoto(file, file.type || "image/jpeg");
      if (fotoSrc) URL.revokeObjectURL(fotoSrc);
      const url = await fetchPerfilFotoBlob(perfil.id);
      setFotoSrc(url);
      setPerfil({ ...perfil, fotoUrl: `/api/perfil/foto/${perfil.id}` });
      showToast("Foto actualizada", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo subir la foto", "error");
    }
  }

  async function onRemoveFoto() {
    if (!perfil) return;
    try {
      await deletePerfilFoto();
      if (fotoSrc) URL.revokeObjectURL(fotoSrc);
      setFotoSrc(null);
      setPerfil({ ...perfil, fotoUrl: null });
      showToast("Foto eliminada", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar la foto", "error");
    }
  }

  if (loading) {
    return (
      <section className="card">
        <p role="status">Cargando perfil…</p>
      </section>
    );
  }

  if (!perfil || !session) {
    return (
      <section className="card">
        <p role="alert">No se pudo mostrar el perfil.</p>
      </section>
    );
  }

  return (
    <div className="stack-lg perfil-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Mi perfil</h1>
          <p>Actualizá tus datos personales y revisá tu actividad en Fondos VIE.</p>
        </div>
      </header>

      <div className="perfil-layout">
        <section className="card stack-md perfil-identity">
          <div className="perfil-avatar-block">
            <div className="perfil-avatar" aria-hidden>
              {fotoSrc ? (
                <img src={fotoSrc} alt="" />
              ) : (
                <span>{nombre.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="action-row">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Cambiar foto de perfil"
                onChange={(e) => void onFotoChange(e.target.files?.[0])}
              />
              <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                Cambiar foto
              </button>
              {fotoSrc && (
                <button type="button" className="btn btn-ghost" onClick={() => void onRemoveFoto()}>
                  Quitar foto
                </button>
              )}
            </div>
            <p className="field-hint">JPEG, PNG o WebP · máximo 2 MiB</p>
          </div>

          <form id={formId} className="stack-md" onSubmit={onSubmit}>
            <label className="field">
              <span className="field-label">Nombre completo</span>
              <input className="input" value={nombre} maxLength={150} required onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Correo institucional</span>
              <input className="input" value={perfil.correo} readOnly />
            </label>
            <label className="field">
              <span className="field-label">Cédula</span>
              <input
                className="input"
                value={cedula}
                placeholder="X-XXXX-XXXX"
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setCedula([d.slice(0, 1), d.slice(1, 5), d.slice(5)].filter(Boolean).join("-"));
                }}
              />
            </label>
            <label className="field">
              <span className="field-label">ORCID</span>
              <input
                className="input"
                value={orcid}
                placeholder="0000-0000-0000-0000"
                maxLength={19}
                onChange={(e) => setOrcid(formatOrcidInput(e.currentTarget))}
              />
            </label>
            <label className="field">
              <span className="field-label">Escuela / dependencia</span>
              <input className="input" value={perfil.escuela ?? "Sin asignar"} readOnly />
            </label>
            <div className="action-row end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>

        <section className="card stack-md">
          <h2>Resumen de actividad</h2>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
            <div className="card stat-card">
              <div className="stat-value">{perfil.oversight.propuestasCoordinadas}</div>
              <div className="stat-label">Propuestas coordinadas</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{perfil.oversight.participaciones}</div>
              <div className="stat-label">Participaciones en equipos</div>
            </div>
          </div>
          <div>
            <h3>Roles asignados</h3>
            <ul className="perfil-roles">
              {perfil.roles.map((r) => (
                <li key={r.codigo}>{r.nombre}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Actividad reciente</h3>
            {perfil.oversight.recientes.length === 0 ? (
              <p className="field-hint">Aún no hay propuestas asociadas.</p>
            ) : (
              <ul className="perfil-recientes">
                {perfil.oversight.recientes.map((r) => (
                  <li key={r.codigo}>
                    <Link to={`/propuestas`}>{r.codigo}</Link>
                    <span>{r.titulo}</span>
                    <span className="badge badge-primary">{labelEstado(r.estado)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
