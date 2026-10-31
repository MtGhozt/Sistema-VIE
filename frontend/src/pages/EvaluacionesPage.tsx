import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import {
  fetchEvaluacionBandeja,
  postEvaluacionAccion,
  type EvaluacionBandejaItem,
} from "../api/evaluaciones";
import {
  AdminEvalTransversal,
  CiePanel,
  ComiteAsistentePanel,
  ComiteEvaluadorPanel,
  ConsejoAsistentePanel,
  ConsejoPanel,
  DireccionEscuelaPanel,
  DireccionInvestigacionPanel,
  GestoraViePanel,
  VinculacionPanel,
} from "../components/evaluation/EvaluationRolePanels";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/toast/ToastContext";
import { type DemoProposal } from "../data/demo";
import { bandejaToDemoProposal } from "../data/evalProposal";
import type { RoleId } from "../data/roles";

const EVAL_HEADERS: Record<RoleId, [string, string, string]> = {
  vie_publicacion: [
    "VIE — Publicación",
    "Gestión de convocatorias",
    "Esta bandeja no aplica a publicación; use Convocatorias.",
  ],
  investigador: [
    "Persona investigadora",
    "Seguimiento de propuestas",
    "Consulte el estado de sus expedientes en Propuestas.",
  ],
  vinculacion: [
    "P3 · Centro de Vinculación",
    "Dictamen de Propiedad Intelectual",
    "Revise los aspectos de propiedad intelectual y registre el oficio técnico. Esta instancia no aprueba ni rechaza la propuesta completa.",
  ],
  comite_asistente: [
    "P4-a · Comité Técnico",
    "Revisión de completitud",
    "Verifique el expediente antes de remitirlo al cuerpo evaluador.",
  ],
  comite_evaluador: [
    "P4-b · Comité Técnico",
    "Evaluación técnica",
    "Evalúe con la rúbrica oficial y registre una valoración humana independiente.",
  ],
  consejo_asistente: [
    "P5-a · Consejo de Escuela",
    "Preparación de expediente",
    "Prepare el expediente para su revisión en el Consejo de Profesores.",
  ],
  consejo: [
    "P5-b · Consejo de Profesores",
    "Aval de Consejo",
    "Revise el expediente consolidado y determine el aval correspondiente.",
  ],
  direccion_escuela: [
    "P5-c · Dirección de Escuela",
    "Comunicación del aval",
    "Comunique a VIE el aval emitido por el Consejo.",
  ],
  gestora_vie: [
    "P6-a · VIE",
    "Verificación de expediente",
    "Revise contenidos, completitud y observaciones antes de remitir al CIE.",
  ],
  cie: [
    "P6-b · CIE",
    "Evaluación y resolución",
    "Evalúe mediante la rúbrica, registre observaciones y emita la resolución institucional.",
  ],
  direccion_investigacion: [
    "P6-c · Dirección de Investigación",
    "Notificación de resolución",
    "Notifique formalmente el resultado emitido por el CIE.",
  ],
  admin: [
    "Super Administrador",
    "Bandeja transversal de evaluación",
    "Seleccione una vista de rol en la barra superior para operar la etapa correspondiente.",
  ],
};

const ACTION_TOAST: Record<string, string> = {
  pi: "Dictamen de PI emitido y oficio agregado al expediente.",
  "committee-ready": "Propuesta enviada al cuerpo evaluador.",
  return: "Propuesta devuelta con observaciones.",
  "save-rubric": "Los cambios de la evaluación se guardaron correctamente.",
  "committee-score":
    "Evaluación completada y preparada para consolidación.",
  "send-council": "Expediente enviado al Consejo de Profesores.",
  "council-approve": "Aval aprobado y oficio generado.",
  "council-reject":
    "Aval rechazado correctamente. Justificación registrada.",
  "communicate-aval":
    "Memorando generado · Envío simulado a Dirección de Investigación / VIE.",
  "vie-observation":
    "Observación enviada correctamente al equipo investigador.",
  "send-cie": "Expediente enviado al CIE.",
  "cie-approve": "Resolución aprobatoria emitida.",
  "cie-reject":
    "Resolución de rechazo emitida. Justificación registrada.",
  "notify-resolution":
    "CIE-453 generado · notificación simulada · expediente en Histórico.",
};

const EVAL_ROLES: RoleId[] = [
  "vinculacion",
  "comite_asistente",
  "comite_evaluador",
  "consejo_asistente",
  "consejo",
  "direccion_escuela",
  "gestora_vie",
  "cie",
  "direccion_investigacion",
];

type BandejaEntry = {
  key: string;
  numericId: number | null;
  demo: DemoProposal;
  api: EvaluacionBandejaItem | null;
};

export function EvaluacionesPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [bandeja, setBandeja] = useState<BandejaEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "demo">("demo");
  const [bandejaNote, setBandejaNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actionPending = useRef(false);

  const role = session?.viewRole ?? "investigador";

  const loadBandeja = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setBandejaNote(null);
    try {
      const res = await fetchEvaluacionBandeja(session.role === "admin" && EVAL_ROLES.includes(role) ? role : undefined);
      const entries: BandejaEntry[] = res.items.map((item) => ({
        key: item.codigo, numericId: item.id, demo: bandejaToDemoProposal(item), api: item,
      }));
      setBandeja(entries);
      setSource("api");
      setSelectedKey((prev) => entries.some((e) => e.key === prev) ? prev : (entries[0]?.key ?? ""));
    } catch (err) {
      setBandeja([]);
      setSource("api");
      setSelectedKey("");
      const detail = err instanceof Error ? err.message : "Error de red";
      setBandejaNote(`No se pudo cargar la bandeja: ${detail}. Reintente la consulta.`);
    } finally {
      setLoading(false);
    }
  }, [session, role]);

  useEffect(() => {
    void loadBandeja();
  }, [loadBandeja, role]);

  const selected = useMemo(
    () => bandeja.find((e) => e.key === selectedKey) ?? bandeja[0],
    [bandeja, selectedKey],
  );

  if (!session) return null;

  const [eyebrow, title, description] = EVAL_HEADERS[role];

  /** Actualiza el expediente demo en pantalla tras una decisión (sin API). */
  function applyDemoAction(action: string, payload?: unknown) {
    if (!selected) return;
    const texto =
      payload &&
      typeof payload === "object" &&
      "texto" in payload &&
      typeof (payload as { texto: unknown }).texto === "string"
        ? (payload as { texto: string }).texto.trim()
        : "";

    setBandeja((prev) =>
      prev.map((e) => {
        if (e.key !== selected.key) return e;
        const next = { ...e.demo };
        switch (action) {
          case "pi":
            next.estado = "En evaluación";
            next.etapa = Math.max(next.etapa, 2);
            next.oficioPI =
              (payload as { oficio?: string } | undefined)?.oficio ??
              next.oficioPI;
            break;
          case "committee-ready":
          case "send-council":
          case "send-cie":
          case "communicate-aval":
            next.etapa = Math.min(6, next.etapa + 1);
            break;
          case "return":
          case "vie-observation":
            if (texto) {
              next.observaciones = [...(next.observaciones ?? []), texto];
            }
            break;
          case "committee-score":
            next.estado = "Dictaminada";
            next.etapa = Math.max(next.etapa, 3);
            next.evaluacionComite = {
              average:
                Number(
                  (payload as { average?: number } | undefined)?.average,
                ) || 80,
            };
            break;
          case "council-approve":
            next.estado = "Avalada";
            next.etapa = Math.max(next.etapa, 4);
            next.justificacionAval = texto || next.justificacionAval;
            next.oficioAval = next.oficioAval || `ESC-DEMO-${next.id}`;
            break;
          case "council-reject":
            next.estado = "Rechazada";
            next.etapa = 6;
            next.justificacionAval = texto || next.justificacionAval;
            break;
          case "cie-approve":
            next.estado = "Aprobada";
            next.etapa = 6;
            next.resolucion = next.resolucion || `CIE-DEMO-${next.id}`;
            break;
          case "cie-reject":
            next.estado = "Rechazada";
            next.etapa = 6;
            next.resolucion = next.resolucion || `CIE-DEMO-${next.id}`;
            break;
          case "notify-resolution":
            next.notificada = true;
            break;
          default:
            break;
        }
        return { ...e, demo: next };
      }),
    );
  }

  const onAction = async (action: string, payload?: unknown) => {
    if (actionPending.current) return false;

    // Justificaciones obligatorias también en modo demo (evita “Confirmar” vacío).
    if (
      (action === "council-approve" ||
        action === "council-reject" ||
        action === "cie-reject" ||
        action === "return" ||
        action === "vie-observation") &&
      !(
        payload &&
        typeof payload === "object" &&
        "texto" in payload &&
        String((payload as { texto: unknown }).texto ?? "").trim()
      )
    ) {
      showToast("La justificación u observación es obligatoria.", "error");
      return false;
    }

    if (source !== "api" || selected?.numericId == null) {
      applyDemoAction(action, payload);
      showToast(
        `${ACTION_TOAST[action] ?? "Acción registrada."} (demo local · no se guardó en PostgreSQL)`,
        "success",
      );
      return true;
    }

    actionPending.current = true;
    setBusy(true);
    try {
      const res = await postEvaluacionAccion(
        selected.numericId,
        action,
        payload,
      );
      showToast(res.message || ACTION_TOAST[action] || "Acción registrada.", "success");
      if (res.propuesta) {
        const mapped = bandejaToDemoProposal(res.propuesta);
        setBandeja((prev) =>
          prev.map((e) =>
            e.numericId === res.propuesta!.id
              ? {
                  key: res.propuesta!.codigo,
                  numericId: res.propuesta!.id,
                  demo: mapped,
                  api: res.propuesta,
                }
              : e,
          ),
        );
        setSelectedKey(res.propuesta.codigo);
      } else {
        await loadBandeja();
      }
      if (["pi","committee-ready","committee-score","send-council","council-approve","council-reject","communicate-aval","send-cie","cie-approve","cie-reject"].includes(action)) await loadBandeja();
      return true;
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "No se pudo persistir la acción";
      showToast(msg, "error");
      return false;
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  };

  if (role === "vie_publicacion") {
    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-actions">
            <Link to="/convocatorias" className="btn btn-primary">
              Ir a convocatorias
            </Link>
          </div>
        </header>
      </>
    );
  }

  if (role === "investigador") {
    return (
      <>
        <header className="page-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="page-actions">
            <Link to="/propuestas" className="btn btn-primary">
              Ver mis propuestas
            </Link>
          </div>
        </header>
      </>
    );
  }

  if (loading) {
    return (
      <section className="card empty-state">
        <strong>Cargando bandeja…</strong>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="card empty-state">
        <strong>{bandejaNote ? "No se pudo consultar la bandeja" : "No hay propuestas disponibles"}</strong>
        {bandejaNote && <p role="alert">{bandejaNote}</p>}
        <button type="button" className="btn btn-secondary" onClick={() => void loadBandeja()}>Actualizar bandeja</button>
        <p className="muted">
          Cuando una investigadora envíe una propuesta, aparecerá aquí según la
          etapa del flujo.
        </p>
      </section>
    );
  }

  const proposal = selected.demo;
  const panelProps = { proposal, onAction };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            {source === "api"
              ? "Expedientes desde PostgreSQL · las acciones se persisten."
              : "Modo demo local · las acciones actualizan esta pantalla pero no la base de datos."}
          </p>
          {bandejaNote && (
            <p className="field-hint" role="status" style={{ marginTop: 8 }}>
              {bandejaNote}
            </p>
          )}
        </div>
      </header>

      {EVAL_ROLES.includes(role) || role === "admin" ? (
        <>
          {role !== "admin" && (
            <div className="evaluation-selector">
              <span>Expediente activo</span>
              <select
                className="input"
                value={selected.key}
                onChange={(e) => setSelectedKey(e.target.value)}
                aria-label="Expediente activo"
                disabled={busy}
              >
                {bandeja.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.key} — {e.demo.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role === "vinculacion" && <VinculacionPanel key={selected.key} {...panelProps} />}
          {role === "comite_asistente" && (
            <ComiteAsistentePanel key={selected.key} {...panelProps} />
          )}
          {role === "comite_evaluador" && (
            <ComiteEvaluadorPanel key={selected.key} {...panelProps} />
          )}
          {role === "consejo_asistente" && (
            <ConsejoAsistentePanel key={selected.key} {...panelProps} />
          )}
          {role === "consejo" && <ConsejoPanel key={selected.key} {...panelProps} />}
          {role === "direccion_escuela" && (
            <DireccionEscuelaPanel key={selected.key} {...panelProps} />
          )}
          {role === "gestora_vie" && <GestoraViePanel key={selected.key} {...panelProps} />}
          {role === "cie" && <CiePanel key={selected.key} {...panelProps} />}
          {role === "direccion_investigacion" && (
            <DireccionInvestigacionPanel key={selected.key} {...panelProps} />
          )}
          {role === "admin" && (
            <>
              <div className="evaluation-selector">
                <span>Expediente activo</span>
                <select
                  className="input"
                  value={selected.key}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  aria-label="Expediente activo"
                  disabled={busy}
                >
                  {bandeja.map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.key} — {e.demo.titulo}
                    </option>
                  ))}
                </select>
              </div>
              <AdminEvalTransversal proposal={proposal} />
              <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
                Cambie «Vista actual» en la barra superior para operar cada
                etapa con el panel completo del prototipo.
              </p>
            </>
          )}
        </>
      ) : (
        <section className="card">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/inicio")}
          >
            Volver al inicio
          </button>
        </section>
      )}
    </>
  );
}
