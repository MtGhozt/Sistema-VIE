import {fetchResumenVinculacion,estadosPi,type ResumenVinculacion} from "../api/vinculacion";
import {closingSoon,dateLabel} from "../data/convocatoriaUi";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { HOME_BY_ROLE, PRIMARY_CTA } from "../data/demo";
import { labelEstado } from "../data/proposalStates";
import { fetchPropuestas, type Propuesta } from "../api/propuestas";
import {
  fetchConvocatorias,
  type Convocatoria,
} from "../api/convocatorias";
import { apiJson } from "../api/client";
import {
  fetchEvaluacionBandeja,
  type EvaluacionBandejaItem,
} from "../api/evaluaciones";
import {
  ProcessTimeline,
  stepFromPropuestaEstado,
} from "../components/ProcessTimeline";
import { IconChevron } from "../components/icons";
import type { RoleId } from "../data/roles";

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

function normEstado(estado: string) {
  return estado.toLowerCase();
}

function isPropuestaActiva(p: Propuesta) {
  const e = normEstado(p.estadoActual);
  return e !== "aprobada" && e !== "rechazada";
}

function formatCierreMeta(fechaCierre: string) {
  return `Cierre ${dateLabel(fechaCierre)}`;
}

function labelConvocatoriaEstado(estado: string) {
  const map: Record<string, string> = {
    borrador: "Borrador",
    activa: "Publicada",
    cerrada: "Cerrada",
    finalizada: "Finalizada",
  };
  return map[estado] ?? estado;
}

function isProximaCierre(c: Convocatoria, today = new Date()) {
  return closingSoon(c,today);
}

function instancePath(label: string) {
  if (label.includes("Investig")) return "/propuestas";
  if (label.toLowerCase().includes("publicaci")) return "/convocatorias";
  return "/evaluaciones";
}

function adminInstanceAccess(
  proposals: Propuesta[],
  convocatorias: Convocatoria[],
): [string, string, string][] {
  const etapa = (n: number) =>
    String(proposals.filter((p) => p.etapaFlujo === n).length);
  const borradores = String(
    proposals.filter((p) => normEstado(p.estadoActual) === "borrador").length,
  );
  const activas = String(
    convocatorias.filter((c) => c.estado === "activa").length,
  );
  return [
    ["VIE - publicación", activas, "convocatorias activas"],
    ["Investigadores", borradores, "propuestas en formulación"],
    ["Vinculación", etapa(1), "dictámenes PI pendientes"],
    ["Comité Técnico", etapa(2), "expedientes por revisar"],
    ["Consejo de Escuela", etapa(3), "avales pendientes"],
    ["Gestora VIE", etapa(4), "expedientes pendientes"],
    ["CIE", etapa(5), "resoluciones pendientes"],
    ["Dirección de Investigación", etapa(6), "notificaciones pendientes"],
  ];
}

function adminStatValue(
  label: string,
  proposals: Propuesta[],
  convocatorias: Convocatoria[],
  userCount: number,
): number {
  const l = label.toLowerCase();
  if (l.includes("usuario")) return userCount;
  if (l.includes("propuesta") && l.includes("activ")) {
    return proposals.filter(isPropuestaActiva).length;
  }
  if (l.includes("convocatoria")) return convocatorias.length;
  if (l.includes("resolucion")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "aprobada")
      .length;
  }
  if (l.includes("accion") && l.includes("pendiente")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      return e !== "borrador" && e !== "aprobada" && e !== "rechazada";
    }).length;
  }
  return 0;
}

function adminStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("usuario")) return "/administracion";
  if (l.includes("propuesta")) return "/propuestas";
  if (l.includes("convocatoria")) return "/convocatorias";
  return "/evaluaciones";
}

function investigadorStatValue(label: string, proposals: Propuesta[]): number {
  const l = label.toLowerCase();
  if (l.includes("borrador")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "borrador")
      .length;
  }
  if (l.includes("corrección") || l.includes("correccion")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      return e === "en_subsanacion" || e.includes("correccion");
    }).length;
  }
  if (l.includes("aprobada")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "aprobada")
      .length;
  }
  if (l.includes("rechazada")) {
    return proposals.filter((p) => normEstado(p.estadoActual) === "rechazada")
      .length;
  }
  if (l.includes("revisión") || l.includes("revision")) {
    return proposals.filter((p) => {
      const e = normEstado(p.estadoActual);
      if (e === "borrador" || e === "aprobada" || e === "rechazada") {
        return false;
      }
      if (e === "en_subsanacion" || e.includes("correccion")) return false;
      return true;
    }).length;
  }
  return 0;
}

function investigadorStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("borrador")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("borrador"))}`;
  }
  if (l.includes("corrección") || l.includes("correccion")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("en_subsanacion"))}`;
  }
  if (l.includes("aprobada")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("aprobada"))}`;
  }
  if (l.includes("rechazada")) {
    return `/propuestas?estado=${encodeURIComponent(labelEstado("rechazada"))}`;
  }
  if(l.includes("revisión")||l.includes("revision"))return "/propuestas?estado=en_revision";
  return "/propuestas";
}

function convocatoriaStatValue(label: string, convocatorias: Convocatoria[]) {
  const l = label.toLowerCase();
  if (l.includes("activa")) {
    return convocatorias.filter((c) => c.estado === "activa").length;
  }
  if (l.includes("borrador")) {
    return convocatorias.filter((c) => c.estado === "borrador").length;
  }
  if (l.includes("próxima") || l.includes("proxima")) {
    return convocatorias.filter((c) => isProximaCierre(c)).length;
  }
  if (l.includes("finaliz")) {
    return convocatorias.filter(
      (c) => c.estado === "cerrada" || c.estado === "finalizada",
    ).length;
  }
  return 0;
}

function convocatoriaStatPath(label: string) {
  const l = label.toLowerCase();
  if (l.includes("activa")) return "/convocatorias?estado=activa";
  if (l.includes("borrador")) return "/convocatorias?estado=borrador";
  if (l.includes("próxima") || l.includes("proxima")) {
    return "/convocatorias?estado=proximas";
  }
  if (l.includes("finaliz")) return "/convocatorias?estado=cerrada";
  return "/convocatorias";
}

function evalRoleStatValue(label: string, items: EvaluacionBandejaItem[]) {
  const l = label.toLowerCase();
  const total = items.length;
  // En bandeja = total de expedientes visibles para el rol
  if (l.includes("bandeja") || l.includes("total") || l.includes("recibid")) {
    return total;
  }
  // Recién enviadas = llegaron al flujo pero aún no están en evaluación activa
  if (l.includes("enviad") || l.includes("recién") || l.includes("recien")) {
    return items.filter((i) => normEstado(i.estadoActual) === "enviada").length;
  }
  // En evaluación = el comité/instancia ya las está trabajando
  if (
    l.includes("en evaluación") ||
    l.includes("en evaluacion") ||
    l.includes("progreso")
  ) {
    return items.filter((i) => normEstado(i.estadoActual) === "en_evaluacion")
      .length;
  }
  // Ya dictaminadas = el comité emitió resultado (pasan a consejo/consolidación)
  if (l.includes("dictamin") || l.includes("consolida") || l.includes("complet")) {
    return items.filter((i) =>
      ["dictaminada", "avalada"].includes(normEstado(i.estadoActual)),
    ).length;
  }
  if (l.includes("pendiente")) return total;
  if (
    l.includes("faltante") ||
    l.includes("devuelt") ||
    l.includes("corrección") ||
    l.includes("correccion")
  ) {
    return items.filter((i) => normEstado(i.estadoActual) === "en_subsanacion")
      .length;
  }
  return 0;
}

function AdminHome({
  home,
  proposals,
  convocatorias,
}: {
  home: (typeof HOME_BY_ROLE)["admin"];
  proposals: Propuesta[];
  convocatorias: Convocatoria[];
}) {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await apiJson<{ id: number }[]>("/api/admin/usuarios");
        if (!cancelled) setUserCount(rows.length);
      } catch {
        if (!cancelled) setUserCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const instanceRows = useMemo(
    () => adminInstanceAccess(proposals, convocatorias),
    [proposals, convocatorias],
  );

  const flowLanes = useMemo(() => {
    const count = (pred: (p: Propuesta) => boolean) =>
      proposals.filter(pred).length;
    return [
      ["Vinculación", count((p) => p.etapaFlujo === 1)],
      ["Comité Técnico", count((p) => p.etapaFlujo === 2)],
      ["Consejo de Escuela", count((p) => p.etapaFlujo === 3)],
      ["VIE", count((p) => p.etapaFlujo === 4)],
      ["CIE", count((p) => p.etapaFlujo === 5)],
      ["Notificación", count((p) => p.etapaFlujo === 6)],
      [
        "Cerradas",
        count(
          (p) =>
            p.etapaFlujo >= 7 ||
            ["aprobada", "rechazada"].includes(normEstado(p.estadoActual)),
        ),
      ],
    ] as [string, number][];
  }, [proposals]);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>
            Vista transversal para supervisar todas las instancias del flujo. Use
            «Vista actual» en la barra superior para operar cualquier rol sin
            cerrar sesión.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/evaluaciones" className="btn btn-secondary">
            Bandejas por rol
          </Link>
          <Link to="/administracion" className="btn btn-primary">
            Administrar sistema
          </Link>
        </div>
      </header>

      <section className="stats-grid stats-grid-five" aria-label="Indicadores">
        {home.stats.map(([label]) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => navigate(adminStatPath(label))}
          >
            <div className="stat-value">
              {adminStatValue(label, proposals, convocatorias, userCount)}
            </div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </section>

      <div className="admin-dashboard-grid">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>Distribución de expedientes por etapa</h2>
              <p>Carga de trabajo según la etapa institucional del flujo.</p>
            </div>
          </div>
          <div className="flow-lanes">
            {flowLanes.map(([name, n], i) => (
              <div key={name} className="flow-lane">
                <span className="flow-index">{i + 1}</span>
                <div>
                  <strong>{name}</strong>
                  <small>
                    {n} expediente{n === 1 ? "" : "s"} en esta etapa
                  </small>
                </div>
                <span className="badge">{n}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-title">
            <div>
              <h2>Acceso a instancias</h2>
              <p>Accesos rápidos con carga actual por instancia.</p>
            </div>
          </div>
          <div className="admin-flow-cards">
            {instanceRows.map(([label, value, meta]) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(instancePath(label))}
              >
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{meta}</small>
                <IconChevron size={16} />
              </button>
            ))}
          </div>
        </article>
      </div>

      <article className="card admin-proposal-table-card">
        <div className="section-title">
          <div>
            <h2>Expedientes activos</h2>
            <p>
              El administrador puede consultar cualquier propuesta y luego cambiar
              a la vista del rol responsable de su etapa.
            </p>
          </div>
        </div>
        <div className="admin-proposal-list">
          {proposals.filter(isPropuestaActiva).slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/propuestas/${p.id}`)}
            >
              <div>
                <strong>
                  {p.codigo} · {p.titulo}
                </strong>
                <span>{p.escuelaNombre}</span>
              </div>
              <span className="badge badge-primary">
                {labelEstado(p.estadoActual)}
              </span>
              <span className="admin-proposal-budget">{p.modalidadLabel}</span>
              <IconChevron size={16} />
            </button>
          ))}
          {proposals.filter(isPropuestaActiva).length === 0 && (
            <div className="empty-state small">
              <strong>Sin expedientes activos</strong>
              <span>Los expedientes aparecerán cuando existan propuestas.</span>
            </div>
          )}
        </div>
      </article>
    </>
  );
}

function InvestigadorHome({
  home,
  proposals,
}: {
  home: (typeof HOME_BY_ROLE)["investigador"];
  proposals: Propuesta[];
}) {
  const navigate = useNavigate();
  const recent = proposals.slice(0, 2);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>{home.description}</p>
        </div>
        <div className="page-actions">
          <Link to="/propuestas/nueva" className="btn btn-primary">
            Crear propuesta
          </Link>
        </div>
      </header>

      <section className="stats-grid stats-grid-five" aria-label="Indicadores">
        {home.stats.map(([label]) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => navigate(investigadorStatPath(label))}
          >
            <div className="stat-value">
              {investigadorStatValue(label, proposals)}
            </div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-title">
          <div>
            <h2>Mis propuestas recientes</h2>
            <p>
              Seguimiento de las propuestas asociadas a la persona investigadora
              coordinadora.
            </p>
          </div>
          <Link to="/propuestas" className="btn btn-ghost">
            Ver todas
          </Link>
        </div>

        {recent.length === 0 ? (
          <article className="card empty-state small">
            <strong>Sin propuestas aún</strong>
            <span>Creá un borrador desde el botón superior.</span>
          </article>
        ) : (
          <div className="recent-proposals-list">
            {recent.map((p, i) => (
              <article
                key={p.id}
                className={`card proposal-dashboard-card${i === 0 ? " featured" : ""}`}
              >
                <div className="proposal-dashboard-head">
                  <div>
                    <div className="proposal-dashboard-meta">
                      <span className="badge badge-primary">
                        {labelEstado(p.estadoActual)}
                      </span>
                      <span>{p.escuelaNombre}</span>
                    </div>
                    <h2>{p.titulo}</h2>
                    <span>
                      {p.codigo} · {p.modalidadLabel}
                    </span>
                  </div>
                  <Link
                    to={`/propuestas/${p.id}`}
                    className="btn btn-ghost"
                  >
                    Ver detalles
                  </Link>
                </div>
                {i === 0 && (
                  <div className="compact-process">
                    <span>Estado del proceso</span>
                    <ProcessTimeline
                      currentStep={stepFromPropuestaEstado(
                        p.estadoActual,
                        p.etapaFlujo,
                      )}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function RoleHome({
  role,
  convocatorias,
  sessionRole,
}: {
  role: RoleId;
  convocatorias: Convocatoria[];
  sessionRole: RoleId;
}) {
  const navigate = useNavigate();
  const home = HOME_BY_ROLE[role];
  const cta = PRIMARY_CTA[role];
  const five = home.stats.length >= 5;
  const [bandejaItems, setBandejaItems] = useState<EvaluacionBandejaItem[]>(
    [],
  );

  const [resumenComite,setResumenComite]=useState<{pendientes:number;reenviadas:number;enviadas:number;devueltas:number}|null>(null);
  const [resumenNotificacion,setResumenNotificacion]=useState<Record<string,number>|null>(null);
  const [pendientesNotificacion,setPendientesNotificacion]=useState<EvaluacionBandejaItem[]>([]);
  const [resumenCie,setResumenCie]=useState<Record<string,number>|null>(null);
  const [pendientesCie,setPendientesCie]=useState<EvaluacionBandejaItem[]>([]);
  const [resumenVie,setResumenVie]=useState<Record<string,number>|null>(null);
  const [pendientesVie,setPendientesVie]=useState<EvaluacionBandejaItem[]>([]);
  const [resumenDireccion,setResumenDireccion]=useState<Record<string,number>|null>(null);
  const [pendientesDireccion,setPendientesDireccion]=useState<EvaluacionBandejaItem[]>([]);
  const [resumenConsejo,setResumenConsejo]=useState<Record<string,number>|null>(null);
  const [pendientesConsejo,setPendientesConsejo]=useState<EvaluacionBandejaItem[]>([]);
  const [evalRefresh,setEvalRefresh]=useState(0);
  useEffect(()=>{if(!["comite_evaluador","consejo_asistente","consejo","direccion_escuela","gestora_vie","cie","direccion_investigacion"].includes(role))return;const refresh=()=>setEvalRefresh(n=>n+1);window.addEventListener("focus",refresh);return()=>window.removeEventListener("focus",refresh);},[role]);
  const [resumenEvaluador,setResumenEvaluador]=useState<{asignadas:number;pendientes:number;borradores:number;entregadas:number}|null>(null);
  const [comiteError,setComiteError]=useState("");
  const isViePublicacion = role === "vie_publicacion";
  const isVinculacion=role==='vinculacion';
  const [piSummary,setPiSummary]=useState<ResumenVinculacion|null>(null);
  const [piError,setPiError]=useState('');const [piRetry,setPiRetry]=useState(0);
  useEffect(()=>{if(!isVinculacion)return;let active=true;setPiSummary(null);setPiError('');fetchResumenVinculacion().then(data=>{if(active)setPiSummary(data);}).catch(e=>{if(active)setPiError(e.message);});return()=>{active=false;};},[isVinculacion,piRetry,sessionRole]);
  const isEvalRole = EVAL_ROLES.includes(role);

  useEffect(() => {
    if (!isEvalRole||isVinculacion) {
      setBandejaItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const view =
          sessionRole === "admin" && isEvalRole ? role : undefined;
        const res = await fetchEvaluacionBandeja(view);
        if (!cancelled) {setBandejaItems(res.items);setResumenNotificacion(res.resumenNotificacion??null);setPendientesNotificacion(res.pendientesNotificacion??[]);setResumenCie(res.resumenCie??null);setPendientesCie(res.pendientesCie??[]);setResumenVie(res.resumenVie??null);setPendientesVie(res.pendientesVie??[]);setResumenComite(res.resumenComite??null);setResumenEvaluador(res.resumenEvaluador??null);setResumenConsejo(res.resumenConsejo??null);setPendientesConsejo(res.pendientesConsejo??[]);setResumenDireccion(res.resumenDireccion??null);setPendientesDireccion(res.pendientesDireccion??[]);setComiteError("");}
      } catch {
        if (!cancelled) {setBandejaItems([]);setResumenNotificacion(null);setPendientesNotificacion([]);setResumenCie(null);setPendientesCie([]);setResumenVie(null);setPendientesVie([]);setResumenComite(null);setResumenEvaluador(null);setResumenConsejo(null);setPendientesConsejo([]);setResumenDireccion(null);setPendientesDireccion([]);setComiteError(role==="direccion_investigacion"?"No se pudieron consultar los indicadores de notificación. Actualice para reintentar.":role==="cie"?"No se pudieron consultar los indicadores CIE. Actualice para reintentar.":role==="gestora_vie"?"No se pudieron consultar los indicadores VIE. Actualice para reintentar.":role==="direccion_escuela"?"No se pudieron consultar las comunicaciones de aval. Actualice para reintentar.":["consejo","consejo_asistente"].includes(role)?"No se pudieron consultar los indicadores del Consejo. Actualice para reintentar.":"No se pudieron consultar los indicadores del Comité. Recargue para reintentar.");}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEvalRole, role, sessionRole,isVinculacion,evalRefresh]);

  const statEntries = useMemo(() => {
    return home.stats.map(([label]) => {
      let value:number|string = 0;
      if(isVinculacion){const state=estadosPi.find(s=>s.indicador===label)?.valor;return {label,value:piError?"—":piSummary&&state?piSummary.conteos[state]:"…"};}
      if(role==='direccion_investigacion'){const key=({'Pendientes de notificar':'pendientes',Notificadas:'notificadas',Aprobaciones:'aprobaciones',Rechazos:'rechazos'} as Record<string,string>)[label];return {label,value:comiteError?'—':resumenNotificacion&&key?resumenNotificacion[key]:'…'};}
      if(role==='cie'){const key=({'Pendientes de resolución':'pendientes','En evaluación':'en_evaluacion',Aprobadas:'aprobadas',Rechazadas:'rechazadas'} as Record<string,string>)[label];return {label,value:comiteError?'—':resumenCie&&key?resumenCie[key]:'…'};}
      if(role==='gestora_vie'){const key=({'Expedientes pendientes':'pendientes','Remitidos al CIE':'remitidos','Listos para CIE':'listos',Devueltos:'devueltos'} as Record<string,string>)[label];return {label,value:comiteError?'—':resumenVie&&key?resumenVie[key]:'…'};}
      if(role==='direccion_escuela'){const key=({'Pendientes de comunicar':'por_comunicar','Comunicados a VIE':'comunicados','En VIE':'en_vie','Aval rechazado':'aval_rechazado'} as Record<string,string>)[label];return {label,value:comiteError?'—':resumenDireccion&&key?resumenDireccion[key]:'…'};}
      if(role==='consejo'){const key=({'Pendientes de aval':'aval_pendiente',Avaladas:'aval_aprobado','Aval rechazado':'aval_rechazado','Reconsideraciones solicitadas':'reconsideracion'} as Record<string,string>)[label];return {label,value:comiteError?'—':resumenConsejo&&key?resumenConsejo[key]:'…'};}
      if(role==='consejo_asistente'){const key=({Recibidos:'recibidos','Pendientes de preparar':'pendientes','En Consejo':'en_consejo',Enviados:'enviados'} as Record<string,'recibidos'|'pendientes'|'en_consejo'|'enviados'>)[label];return {label,value:comiteError?'—':resumenConsejo&&key?resumenConsejo[key]:'…'};}
      if(role==='comite_evaluador'){const key=({'En bandeja':'asignadas','Pendientes de evaluar':'pendientes','Borradores de evaluación':'borradores','Evaluaciones entregadas':'entregadas'} as Record<string,'asignadas'|'pendientes'|'borradores'|'entregadas'>)[label];return {label,value:comiteError?'—':resumenEvaluador&&key?resumenEvaluador[key]:'…'};}
      if(role==="comite_asistente"){const key=({Pendientes:"pendientes","Reenviadas por revisar":"reenviadas","Listas para evaluación":"enviadas",Devueltas:"devueltas"} as const)[label as "Pendientes"];return {label,value:comiteError?"—":resumenComite&&key?resumenComite[key]:"…"};}
      if (isViePublicacion) {
        value = convocatoriaStatValue(label, convocatorias);
      } else if (isEvalRole) {
        value = evalRoleStatValue(label, bandejaItems);
      }
      return { label, value };
    });
  }, [home.stats, isViePublicacion, isEvalRole, convocatorias, bandejaItems,isVinculacion,piSummary,piError,role,resumenComite,comiteError,resumenEvaluador,resumenConsejo,resumenDireccion,resumenVie,resumenCie,resumenNotificacion]);

  const vieTasks = useMemo(() => {
    if (!isViePublicacion) return [];
    return convocatorias.filter(c=>closingSoon(c))
      .sort((a, b) => a.fechaCierre.localeCompare(b.fechaCierre))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        title: c.nombre,
        status: labelConvocatoriaEstado(c.estado),
        meta: formatCierreMeta(c.fechaCierre),
        path: `/convocatorias/${c.id}`,
      }));
  }, [convocatorias, isViePublicacion]);

  /** Pendientes reales desde bandeja API (sin lista demo alambrada). */
  const pendingTasks = useMemo(() => {
    if(role==='direccion_investigacion')return pendientesNotificacion.map(item=>({id:item.id,title:item.titulo,status:'Pendiente de notificar',meta:`${item.codigo} · Resolución ${dateLabel(item.fechaResolucion).replaceAll('-','/')} · ${item.escuela}`,path:`/evaluaciones?propuesta=${item.id}`}));
    if(role==='cie')return pendientesCie.map(item=>({id:item.id,title:item.titulo,status:'Pendiente de resolución CIE',meta:`${item.codigo} · ${item.escuela}`,path:`/evaluaciones?propuesta=${item.id}`}));
    if(role==='gestora_vie')return pendientesVie.map(item=>({id:item.id,title:item.titulo,status:'Pendiente de verificación VIE',meta:`${item.codigo} · ${item.escuela}`,path:`/evaluaciones?propuesta=${item.id}`}));
    if(role==='direccion_escuela')return pendientesDireccion.map(item=>({id:item.id,title:item.titulo,status:'Pendiente de comunicación',meta:`${item.codigo} · Aval ${dateLabel(item.fechaAval??item.fechaEnvio).replaceAll('-','/')} · ${item.escuela}`,path:`/evaluaciones?propuesta=${item.id}`}));
    if(['consejo_asistente','consejo'].includes(role))return pendientesConsejo.map(item=>({id:item.id,title:item.titulo,status:role==='consejo'?(item.estadoActual==='rechazo_aval'?'Reconsideración solicitada':'Pendiente de aval'):'Pendiente de remisión',meta:`${item.codigo} · Dictamen ${dateLabel(item.fechaDictamenComite??item.fechaEnvio).replaceAll('-','/')} · ${item.escuela}`,path:`/evaluaciones?propuesta=${item.id}`}));
    if(isVinculacion)return (piSummary?.pendientes??[]).map(item=>({id:item.id,title:item.titulo,status:item.estadoPiLabel??'',meta:`${item.codigo} · Enviada ${dateLabel(item.fechaEnvio).replaceAll('-','/')} · ${item.escuela}`,path:`/historico/${encodeURIComponent(item.codigo)}`}));
    if (isViePublicacion || !isEvalRole) return [];
    return [...bandejaItems]
      .sort((a, b) => {
        const fa = a.fechaEnvio ?? "";
        const fb = b.fechaEnvio ?? "";
        return fb.localeCompare(fa);
      })
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: item.titulo,
        status: item.estadoLabel || labelEstado(item.estadoActual),
        meta: `${item.codigo} · ${item.escuela}`,
        path: `/evaluaciones?propuesta=${item.id}`,
      }));
  }, [isViePublicacion, isEvalRole, bandejaItems,isVinculacion,piSummary,role,pendientesConsejo,pendientesDireccion,pendientesVie,pendientesCie,pendientesNotificacion]);

  function statNavigate(label: string) {
    if(role==='direccion_investigacion'){const key=({'Pendientes de notificar':'pendientes',Notificadas:'notificadas',Aprobaciones:'aprobaciones',Rechazos:'rechazos'} as Record<string,string>)[label];navigate('/historico?notificacion='+key);return;}
    if(role==='cie'){const key=({'Pendientes de resolución':'pendientes','En evaluación':'en_evaluacion',Aprobadas:'aprobadas',Rechazadas:'rechazadas'} as Record<string,string>)[label];navigate('/historico?cie='+key);return;}
    if(role==='gestora_vie'){const key=({'Expedientes pendientes':'pendientes','Remitidos al CIE':'remitidos','Listos para CIE':'listos',Devueltos:'devueltos'} as Record<string,string>)[label];navigate('/historico?vie='+key);return;}
    if(role==='direccion_escuela'){const key=({'Pendientes de comunicar':'por_comunicar','Comunicados a VIE':'comunicados','En VIE':'en_vie','Aval rechazado':'aval_rechazado'} as Record<string,string>)[label];navigate(key==='por_comunicar'?'/evaluaciones?direccion='+key:'/historico?direccion='+key);return;}
    if(role==='consejo'){const key=({'Pendientes de aval':'aval_pendiente',Avaladas:'aval_aprobado','Aval rechazado':'aval_rechazado','Reconsideraciones solicitadas':'reconsideracion'} as Record<string,string>)[label];navigate(['aval_pendiente','reconsideracion'].includes(key)?'/evaluaciones?consejo='+key:'/historico?consejo='+key);return;}
    if(role==='consejo_asistente'){const key=({Recibidos:'recibidos','Pendientes de preparar':'pendientes','En Consejo':'en_consejo',Enviados:'enviados'} as Record<string,string>)[label];navigate(key==='pendientes'?'/evaluaciones?consejo=pendientes':'/historico?consejo='+key);return;}
    if(role==='comite_evaluador'){navigate(label==='Evaluaciones entregadas'?'/historico?evaluacion=completada':label==='Pendientes de evaluar'?'/evaluaciones?evaluacion=pendiente':label==='Borradores de evaluación'?'/evaluaciones?evaluacion=en_progreso':'/evaluaciones');return;}
    if(role==="comite_asistente"){navigate(label==="Devueltas"?"/historico?comite=devueltas":"/evaluaciones?comite="+(label==="Reenviadas por revisar"?"reenviadas":label==="Listas para evaluación"?"enviadas":"recepcion"));return;}
    if(isVinculacion){const state=estadosPi.find(s=>s.indicador===label)?.valor;navigate('/historico'+(state?'?pi='+state:''));return;}
    if (isViePublicacion) {
      navigate(convocatoriaStatPath(label));
      return;
    }
    navigate("/evaluaciones");
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p>{home.description}</p>
        </div>
        <div className="page-actions">
          <Link to={isVinculacion?"/historico?pi=pendiente":cta.path} className="btn btn-primary">
            {isVinculacion?"Consultar expedientes PI":cta.label}
          </Link>
        </div>
      </header>

      {["comite_evaluador","consejo_asistente","consejo","direccion_escuela","gestora_vie","cie","direccion_investigacion"].includes(role)&&<button type="button" className="btn btn-secondary" onClick={()=>setEvalRefresh(n=>n+1)}>Actualizar indicadores</button>}
      {["comite_asistente","comite_evaluador","consejo_asistente","consejo","direccion_escuela","gestora_vie","cie","direccion_investigacion"].includes(role)&&comiteError&&<p role="alert">{comiteError}</p>}
      <section
        className={`stats-grid${five ? " stats-grid-five" : ""}`}
        aria-label="Indicadores"
      >
        {statEntries.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            className="card stat-card"
            onClick={() => statNavigate(label)}
          >
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </button>
        ))}
      </section>

      {isVinculacion&&piError&&<div className="card feedback-error" role="alert">No se pudieron consultar los registros de PI: {piError}<button className="btn btn-secondary" onClick={()=>setPiRetry(v=>v+1)}>Reintentar consulta</button></div>}
      <div className="dashboard-grid">
        <article className="card">
          <div className="section-title">
            <div>
              <h2>{isViePublicacion?"Convocatorias próximas a cerrar":isVinculacion?"Pendientes de PI más antiguos":role==="direccion_escuela"?"Avales más antiguos por comunicar":role==="consejo"?"Avales y reconsideraciones pendientes":role==="consejo_asistente"?"Expedientes más antiguos por preparar":"Pendientes prioritarios"}</h2>
              <p>
                {role==="direccion_investigacion"?"Solo resoluciones CIE aún no notificadas, por antigüedad de la resolución; máximo cinco.":role==="cie"?"Solo expedientes remitidos formalmente al CIE y pendientes de resolución, por antigüedad de la remisión; máximo cinco.":role==="gestora_vie"?"Solo expedientes comunicados a VIE y pendientes de verificación, por antigüedad de la comunicación; máximo cinco.":role==="direccion_escuela"?"Solo avales aprobados pendientes de comunicación, ordenados por antigüedad del aval; máximo cinco.":role==="consejo"?"Solo expedientes remitidos pendientes de decisión y reconsideraciones solicitadas. Orden de antigüedad del dictamen; máximo cinco.":role==="consejo_asistente"?"Consolidados pendientes de remisión, por antigüedad del dictamen del Comité. Máximo cinco; no incluye expedientes ya remitidos o con decisión.":isVinculacion?piSummary?.criterio??"Ordenados por mayor antigüedad desde el envío.":isViePublicacion?"Publicadas con cierre en los próximos 30 días, de la fecha más cercana a la más lejana.":"Tareas que requieren atención según la responsabilidad institucional actual."}
              </p>
            </div>
          </div>
          <div className="task-list">{isVinculacion&&!piSummary&&!piError&&<p role="status">Consultando pendientes de PI…</p>}{["consejo_asistente","consejo"].includes(role)&&!resumenConsejo&&!comiteError&&<p role="status">Consultando consolidados pendientes…</p>}
            {isViePublicacion &&
              vieTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="task-row"
                  onClick={() => navigate(task.path)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <div className="task-row-end">
                    <span className="badge badge-primary">{task.status}</span>
                    <IconChevron size={16} />
                  </div>
                </button>
              ))}
            {!isViePublicacion &&
              pendingTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="task-row"
                  onClick={() => navigate(task.path)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <div className="task-row-end">
                    <span className="badge badge-primary">{task.status}</span>
                    <IconChevron size={16} />
                  </div>
                </button>
              ))}
            {isViePublicacion && vieTasks.length === 0 && (
              <div className="empty-state small">
                <strong>No hay cierres próximos</strong>
                <span>Ninguna convocatoria publicada cierra en los próximos 30 días.</span>
              </div>
            )}
            {!isViePublicacion && isEvalRole && pendingTasks.length === 0 && (!isVinculacion||Boolean(piSummary)) && (!["consejo_asistente","consejo"].includes(role)||Boolean(resumenConsejo)) && (role!=="direccion_escuela"||Boolean(resumenDireccion)) && (role!=="gestora_vie"||Boolean(resumenVie)) && (role!=="cie"||Boolean(resumenCie)) && (role!=="direccion_investigacion"||Boolean(resumenNotificacion)) && (
              <div className="empty-state small">
                <strong>Sin pendientes</strong>
                <span>No hay expedientes en su bandeja en este momento.</span>
              </div>
            )}
          </div>
        </article>

        <article className="card quick-panel">
          <div className="section-title">
            <div>
              <h2>Accesos rápidos</h2>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/historico")}>
            <span>Consulta histórica</span>
            <IconChevron size={17} />
          </button>
          <button type="button" onClick={() => navigate("/notificaciones")}>
            <span>Centro de notificaciones</span>
            <IconChevron size={17} />
          </button>
          <button type="button" onClick={() => navigate(cta.path)}>
            <span>{isVinculacion?"Consultar expedientes PI":cta.label}</span>
            <IconChevron size={17} />
          </button>
        </article>
      </div>
    </>
  );
}

export function InicioPage() {
  const { session } = useAuth();
  const [proposals, setProposals] = useState<Propuesta[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);

  const role = session?.viewRole;
  const sessionRole = session?.role;
  const needsProposals = role === "investigador" || role === "admin";
  const needsConvocatorias =
    role === "admin" || role === "vie_publicacion";

  const loadPropuestas = useCallback(async () => {
    if (!needsProposals) {
      setProposals([]);
      return;
    }
    try {
      setProposals(await fetchPropuestas());
    } catch {
      setProposals([]);
    }
  }, [needsProposals]);

  const loadConvocatorias = useCallback(async () => {
    if (!needsConvocatorias) {
      setConvocatorias([]);
      return;
    }
    try {
      setConvocatorias(await fetchConvocatorias());
    } catch {
      setConvocatorias([]);
    }
  }, [needsConvocatorias]);

  useEffect(() => {
    void loadPropuestas();
  }, [loadPropuestas]);

  useEffect(() => {
    void loadConvocatorias();
  }, [loadConvocatorias]);

  if (!session || !role || !sessionRole) return null;

  if (role === "admin") {
    return (
      <AdminHome
        home={HOME_BY_ROLE.admin}
        proposals={proposals}
        convocatorias={convocatorias}
      />
    );
  }

  if (role === "investigador") {
    return (
      <InvestigadorHome
        home={HOME_BY_ROLE.investigador}
        proposals={proposals}
      />
    );
  }

  return (
    <RoleHome
      role={role}
      convocatorias={convocatorias}
      sessionRole={sessionRole}
    />
  );
}
