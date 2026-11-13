import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate,useSearchParams } from "react-router-dom";
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
  "council-approve": "Aval aprobado y número de oficio registrado.",
  "council-reject":
    "Aval rechazado correctamente. Justificación registrada.",
  "communicate-aval":
    "Comunicación del aval registrada para VIE.",
  "vie-observation":
    "Observación enviada correctamente al equipo investigador.",
  "send-cie": "Expediente enviado al CIE.",
  "cie-approve": "Resolución aprobatoria emitida.",
  "cie-reject":
    "Resolución de rechazo emitida. Justificación registrada.",
  "notify-resolution":
    "Notificación persistida para la persona coordinadora.",
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
  const [search,setSearch]=useSearchParams();const requested=search.get("propuesta");const comiteFilter=search.get("comite");const evaluacionFilter=search.get("evaluacion");const consejoFilter=search.get("consejo");const direccionFilter=search.get("direccion");
  const { showToast } = useToast();
  const [bandeja, setBandeja] = useState<BandejaEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [bandejaNote, setBandejaNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const actionPending = useRef(false);

  const role = session?.viewRole ?? "investigador";

  const loadBandeja = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setBandejaNote(null);
    try {
      const res = await fetchEvaluacionBandeja(session.role === "admin" && EVAL_ROLES.includes(role) ? role : undefined,requested,comiteFilter,evaluacionFilter,consejoFilter,direccionFilter);
      const entries: BandejaEntry[] = res.items.map((item) => ({
        key: item.codigo, numericId: item.id, demo: bandejaToDemoProposal(item), api: item,
      }));
      setBandeja(entries);
      const target=requested?entries.find(e=>String(e.numericId)===requested||e.key===requested):undefined;
      if(requested&&!target){setSelectedKey('');setBandejaNote('El expediente solicitado no está disponible para evaluar en esta bandeja. Consulte su registro en el histórico.');}
      else setSelectedKey(prev=>target?.key??(entries.some(e=>e.key===prev)?prev:entries[0]?.key??''));
    } catch (err) {
      setBandeja([]);
      setSelectedKey("");
      const detail = err instanceof Error ? err.message : "Error de red";
      setBandejaNote(`No se pudo cargar la bandeja: ${detail}. Reintente la consulta.`);
    } finally {
      setLoading(false);
    }
  }, [session, role,requested,comiteFilter,evaluacionFilter,consejoFilter,direccionFilter]);

  useEffect(() => {
    void loadBandeja();
  }, [loadBandeja, role]);

  const selected = useMemo(
    () => bandeja.find((e) => e.key === selectedKey),
    [bandeja, selectedKey],
  );

  if (!session) return null;

  const [eyebrow, title, description] = EVAL_HEADERS[role];

  const onAction = async (action: string, payload?: unknown) => {
    if (actionPending.current) return false;

    // No enviar decisiones sin fundamento.
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

    if (selected?.numericId == null) {showToast('Seleccione un expediente real antes de ejecutar la acción','error');return false;}

    actionPending.current = true;
    setBusy(true);
    try {
      const res = await postEvaluacionAccion(
        selected.numericId,
        action,
        payload,
      );
      showToast(res.message || ACTION_TOAST[action] || "Acción registrada.", "success");
      if(role==='vinculacion'&&['pi','pi-not-required'].includes(action)){
        navigate(`/historico/${encodeURIComponent(selected.key)}`,{state:{returnTo:'/historico?pi='+(action==='pi'?'emitido':'no_requerido')}});return true;
      }
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
      if(role==='direccion_escuela'&&action==='communicate-aval'){navigate('/historico?direccion=comunicados');return true;}
      if(role==='consejo'&&['council-approve','council-reject'].includes(action)){navigate('/historico?consejo='+(action==='council-approve'?'aval_aprobado':'aval_rechazado'));return true;}
      if(role==='consejo'&&action==='council-reconsider'){navigate('/historico?consejo=pendientes');return true;}
      if(role==='consejo_asistente'&&action==='send-council'){navigate('/historico?consejo=enviados');return true;}
      if(role==='comite_evaluador'&&action==='committee-score'){navigate('/historico?evaluacion=completada');return true;}
      if (["pi","pi-not-required","return","committee-confirm","council-reconsider","committee-ready","committee-score","send-council","council-approve","council-reject","communicate-aval","send-cie","cie-approve","cie-reject"].includes(action)) await loadBandeja();
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
      <section className="card empty-state" aria-busy="true">
        <h1 className="sr-only">{title}</h1>
        <p role="status" aria-live="polite">
          Cargando bandeja…
        </p>
      </section>
    );
  }

  if (!selected) {
    return (
      <section className="card empty-state">
        <h1 className="sr-only">{title}</h1>
        {role==='direccion_escuela'&&<Link className="btn btn-secondary" to="/historico?direccion=comunicados">Consultar avales comunicados</Link>}
        {role==='consejo'&&<Link className="btn btn-secondary" to="/historico">Consultar avales y rechazos</Link>}
        {role==='comite_evaluador'&&<Link className="btn btn-secondary" to="/evaluaciones">Ver mis evaluaciones pendientes</Link>}
        {role==='comite_asistente'&&comiteFilter&&<Link className="btn btn-secondary" to="/evaluaciones">Ver todas las fases del Comité</Link>}
        <strong>{bandejaNote ? "No se pudo consultar la bandeja" : "No hay propuestas disponibles"}</strong>
        {bandejaNote && <p role="alert">{bandejaNote}</p>}
        <button type="button" className="btn btn-secondary" onClick={() => void loadBandeja()}>Actualizar bandeja</button>{role==="vinculacion"&&<Link className="btn btn-secondary" to="/historico">Consultar histórico de PI</Link>}
        <p className="muted">
          {role==="direccion_escuela"?"Aquí aparecen los avales aprobados pendientes de comunicación. Lo ya comunicado se consulta en Histórico.":role==="consejo"?"Los expedientes aparecerán cuando el asistente los remita al Consejo o se solicite reconsideración.":"Los expedientes aparecen aquí según la etapa y asignación que corresponden a su rol."}
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
            Expedientes desde PostgreSQL · las acciones se persisten.
          </p>
          {bandejaNote && (
            <p className="field-hint" role="status" style={{ marginTop: 8 }}>
              {bandejaNote}
            </p>
          )}
        </div>
      </header>

      {role==='consejo'&&<label className="field"><span>Trabajo del Consejo</span><select aria-label="Trabajo del Consejo" className="input" value={consejoFilter??''} onChange={e=>setSearch(e.target.value?{consejo:e.target.value}:{})}><option value="">Pendientes y reconsideraciones</option><option value="aval_pendiente">Pendientes de aval</option><option value="reconsideracion">Reconsideraciones solicitadas</option></select></label>}
      {role==='comite_evaluador'&&<label className="field"><span>Mi evaluación</span><select aria-label="Mi evaluación" className="input" value={evaluacionFilter??''} onChange={e=>setSearch(e.target.value?{evaluacion:e.target.value}:{})}><option value="">Pendientes y borradores</option><option value="pendiente">Pendientes de evaluar</option><option value="en_progreso">Borradores de evaluación</option><option value="completada">Evaluaciones entregadas (solo lectura)</option></select></label>}
      {role==='comite_asistente'&&<label className="field"><span className="field-label">Fase del Comité</span><select className="input" aria-label="Fase del Comité" value={comiteFilter??''} onChange={e=>setSearch(e.target.value?{comite:e.target.value}:{})}><option value="">Todas las fases</option><option value="recepcion">Pendientes de completitud</option><option value="reenviadas">Reenviadas por revisar</option><option value="enviadas">Enviadas al Cuerpo Evaluador</option></select></label>}
      {EVAL_ROLES.includes(role) || role === "admin" ? (
        <>
          {role !== "admin" && (
            <div className={["comite_evaluador","consejo_asistente","consejo","direccion_escuela"].includes(role)?"evaluation-selector evaluator-selector":"evaluation-selector"}>
              <span>Expediente activo</span>
              <select
                className="input"
                value={selected.key}
                onChange={e=>{setSelectedKey(e.target.value);const item=bandeja.find(p=>p.key===e.target.value);if(item){const params=new URLSearchParams(search);params.set("propuesta",String(item.numericId));setSearch(params,{replace:true});}}}
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
                  onChange={e=>{setSelectedKey(e.target.value);const item=bandeja.find(p=>p.key===e.target.value);if(item){const params=new URLSearchParams(search);params.set("propuesta",String(item.numericId));setSearch(params,{replace:true});}}}
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
