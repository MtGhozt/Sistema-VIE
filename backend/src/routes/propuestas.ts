import {validarNombramiento} from "../propuestaEquipo.js";
import { alcancePropuestas, exigirAlcance, etapaRol } from "../alcancePropuestas.js";
import { siguienteCodigo } from "../numeracionPropuestas.js";
import { cargarSubsanacion, validarEdicionSubsanacion, seccionesSubsanacion } from "../subsanacion.js";
import { HttpError } from "../middleware/HttpError.js";
import { savePropuestaCampos } from "../propuestaCampos.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { loadPropuestaDisplay } from "../propuestaDetalle.js";
import { query, transaction } from "../db.js";
import { requireDemoAuth } from "../middleware/demoAuth.js";

export const propuestasRouter = Router();

const MODALIDAD_MAP: Record<string, string> = {
  "Investigación básica": "basica",
  "Investigación aplicada": "aplicada",
  "Investigación básica y aplicada": "basica_aplicada",
  "Desarrollo tecnológico": "desarrollo_tecnologico",
  basica: "basica",
  aplicada: "aplicada",
  basica_aplicada: "basica_aplicada",
  desarrollo_tecnologico: "desarrollo_tecnologico",
  fortalecimiento: "fortalecimiento",
};

const MODALIDAD_LABEL: Record<string, string> = {
  basica: "Investigación básica",
  aplicada: "Investigación aplicada",
  basica_aplicada: "Investigación básica y aplicada",
  desarrollo_tecnologico: "Desarrollo tecnológico",
  fortalecimiento: "Fortalecimiento",
};

type PropuestaRow = {
  id_propuesta: number;
  codigo: string;
  id_convocatoria: number;
  id_coordinador: number;
  id_escuela: number;
  titulo: string;
  modalidad: string;modalidad_nombre:string|null;
  resumen: string | null;
  abstract_en: string | null;
  problema: string | null;
  objetivo_general: string | null;
  metodologia: string | null;
  estado_arte: string | null;
  referencias: string | null;
  hoja_ruta: string | null;
  divulgacion: string | null;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  trl_actual:number|null;trl_esperado:number|null;lineas:number[];lineas_nombres:string[];
  requiere_dictamen_pi: boolean;
  pi_acreditada: boolean;
  declaracion_aceptada: boolean;
  resguardo_repositorio: boolean;
  resguardo_tecnico: boolean;
  estado_actual: string;
  etapa_flujo: number;
  fecha_envio: string | null;
  convocatoria_nombre: string;
  coordinador_nombre: string;
  escuela_nombre: string;
};

function mapPropuesta(row: PropuestaRow) {
  return {
    id: row.id_propuesta,
    codigo: row.codigo,
    idConvocatoria: row.id_convocatoria,
    convocatoriaNombre: row.convocatoria_nombre,
    idCoordinador: row.id_coordinador,
    coordinadorNombre: row.coordinador_nombre,
    idEscuela: row.id_escuela,
    escuelaNombre: row.escuela_nombre,
    titulo: row.titulo,
    modalidad: row.modalidad,
    modalidadLabel: row.modalidad_nombre ?? MODALIDAD_LABEL[row.modalidad] ?? row.modalidad,
    resumen: row.resumen,
    abstractEn: row.abstract_en,
    problema: row.problema,
    objetivoGeneral: row.objetivo_general,
    metodologia: row.metodologia,
    declaracion: row.declaracion_aceptada, resguardoRepositorio: row.resguardo_repositorio, resguardoTecnico: row.resguardo_tecnico,
    estadoArte: row.estado_arte, referencias: row.referencias, hojaRuta: row.hoja_ruta, divulgacion: row.divulgacion,
    trlActual:row.trl_actual,trlEsperado:row.trl_esperado,lineas:row.lineas,lineasNombres:row.lineas_nombres,
    fechaInicio: row.fecha_inicio, fechaFin: row.fecha_finalizacion, requiereDictamenPi: row.requiere_dictamen_pi, piAcreditada: row.pi_acreditada,
    estadoActual: row.estado_actual,
    etapaFlujo: row.etapa_flujo,
    fechaEnvio: row.fecha_envio,
  };
}

const BASE_SELECT = `
  SELECT p.*, mc.nombre AS modalidad_nombre,ARRAY(SELECT pl.id_linea_investigacion FROM propuesta_linea pl WHERE pl.id_propuesta=p.id_propuesta ORDER BY pl.id_linea_investigacion) AS lineas,ARRAY(SELECT l.nombre FROM propuesta_linea pl JOIN linea_investigacion l ON l.id_linea_investigacion=pl.id_linea_investigacion WHERE pl.id_propuesta=p.id_propuesta ORDER BY l.nombre) AS lineas_nombres,
    CASE WHEN p.requiere_dictamen_pi THEN EXISTS(SELECT 1 FROM dictamen_pi d WHERE d.id_propuesta=p.id_propuesta AND d.estado='emitido' AND d.fecha_dictamen IS NOT NULL)
      ELSE EXISTS(SELECT 1 FROM pi_certificacion_no_requerido pc WHERE pc.id_propuesta=p.id_propuesta) END AS pi_acreditada,
    c.nombre AS convocatoria_nombre,
    u.nombre_completo AS coordinador_nombre,
    e.nombre AS escuela_nombre
  FROM propuesta p
  LEFT JOIN modalidad_catalogo mc ON mc.codigo=p.modalidad
  JOIN convocatoria c ON c.id_convocatoria = p.id_convocatoria
  JOIN usuario u ON u.id_usuario = p.id_coordinador
  JOIN escuela e ON e.id_escuela = p.id_escuela
`;

function canWriteProposals(role: string | null | undefined) {
  return role === "investigador" || role === "admin";
}

async function loadKeywords(idPropuesta: number, execute: typeof query = query) {
  const result = await execute<{ idioma: string; palabra: string }>(
    `
    SELECT idioma, palabra FROM propuesta_palabra_clave
    WHERE id_propuesta = $1
    ORDER BY id_palabra_clave
    `,
    [idPropuesta],
  );
  const es: string[] = [];
  const en: string[] = [];
  for (const row of result.rows) {
    if (row.idioma === "es") es.push(row.palabra);
    else if (row.idioma === "en") en.push(row.palabra);
  }
  return { keywordsEs: es, keywordsEn: en };
}

async function replaceKeywords(
  idPropuesta: number,
  keywordsEs: string[] | undefined,
  keywordsEn: string[] | undefined,
  execute: typeof query = query,
) {
  if (keywordsEs === undefined && keywordsEn === undefined) return;
  for (const [idioma, words] of [["es", keywordsEs], ["en", keywordsEn]] as const) {
    if (words !== undefined) {
      await execute(`DELETE FROM propuesta_palabra_clave WHERE id_propuesta = $1 AND idioma = $2`, [idPropuesta, idioma]);
    }
  }
  const pairs: [string, string][] = [];
  for (const p of keywordsEs ?? []) {
    const word = p.trim();
    if (word) pairs.push(["es", word]);
  }
  for (const p of keywordsEn ?? []) {
    const word = p.trim();
    if (word) pairs.push(["en", word]);
  }
  const seen=new Set<string>();
  for(const [idioma,palabra] of pairs){
    const language=idioma==='es'?'español':'inglés';
    if(palabra.length>100)throw new HttpError(400,`Palabras clave (${language}): el término «${palabra.slice(0,40)}…» supera los 100 caracteres permitidos. Acórtelo antes de guardar.`);
    const key=JSON.stringify([idioma,palabra]);
    if(seen.has(key))throw new HttpError(409,`Palabras clave (${language}): el término «${palabra}» está repetido. Quite la repetición antes de guardar.`);
    seen.add(key);
  }
  for (const [idioma, palabra] of pairs) {
    await execute(
      `
      INSERT INTO propuesta_palabra_clave (id_propuesta, idioma, palabra)
      VALUES ($1, $2, $3)
      `,
      [idPropuesta, idioma, palabra],
    );
  }
}

function parseKeywordInput(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

propuestasRouter.get("/personas", requireDemoAuth, asyncHandler(async (_req, res) => {
  const result = await query("SELECT u.id_usuario AS id, u.nombre_completo AS nombre, e.nombre AS instancia, ARRAY(SELECT r.codigo FROM usuario_rol ur JOIN rol r ON r.id_rol=ur.id_rol WHERE ur.id_usuario=u.id_usuario) AS roles FROM usuario u LEFT JOIN escuela e ON e.id_escuela=u.id_escuela WHERE u.activo=true ORDER BY u.nombre_completo");
  res.json(result.rows);
}));

/** Listado: investigador ve las suyas; admin ve todas. */
propuestasRouter.get("/propuestas", requireDemoAuth, asyncHandler(async (req, res) => {
  const role = req.demoAuth!.role;
  const userId = req.demoAuth!.userId!;
  const scope = alcancePropuestas({role,userId});
  const result = await query<PropuestaRow>(`${BASE_SELECT} WHERE ${scope.sql} ORDER BY p.id_propuesta DESC`,scope.params);
  res.json(result.rows.map(mapPropuesta));
}));

propuestasRouter.get("/propuestas/:id", requireDemoAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "id inválido" });
    return;
  }
  const result = await query<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  await exigirAlcance(id, req.demoAuth!);
  const keywords = await loadKeywords(id);
  const display = await loadPropuestaDisplay(id);
  if (!["admin", "investigador"].includes(req.demoAuth!.role!)) {
    const stage = etapaRol(req.demoAuth!.role);
    const own = await query<{mensaje:string}>("SELECT mensaje FROM observacion WHERE id_propuesta=$1 AND etapa=$2 ORDER BY fecha_creacion",[id,stage===2?"comite":stage===4?"vie":req.demoAuth!.role]);
    display.observaciones = own.rows.map(r=>r.mensaje);
    const history = await query<{id:number;titulo:string;detalle:string;fecha:Date;etapa:number;instancia_conocida:boolean}>(`SELECT h.id_historial AS id,h.estado_nuevo AS titulo,h.observacion AS detalle,h.fecha_hora AS fecha,
      COALESCE(h.etapa_evento,CASE h.estado_nuevo WHEN 'enviada' THEN 1 WHEN 'en_evaluacion' THEN 2 WHEN 'dictaminada' THEN 2 WHEN 'avalada' THEN 3 WHEN 'aprobada' THEN 6 WHEN 'rechazada' THEN 6 ELSE 0 END) AS etapa,h.etapa_evento IS NOT NULL AS instancia_conocida FROM propuesta_historial_estado h WHERE h.id_propuesta=$1 ORDER BY h.fecha_hora`,[id]);
    display.timeline = history.rows.filter(h=>h.etapa>0&&h.etapa<=stage).map(h=>({id:h.id,titulo:h.titulo,detalle:h.etapa===stage&&h.instancia_conocida?h.detalle:"Etapa previa completada: "+h.titulo,fecha:h.fecha.toISOString()}));
  }
  const correction=await cargarSubsanacion(id);
  const ownCorrection=["admin","investigador"].includes(req.demoAuth!.role!) || correction?.rol_destino===req.demoAuth!.role;
  res.json({ ...mapPropuesta(row), ...keywords, ...display, subsanacion: ownCorrection?correction:null, seccionesSubsanacion });
}));

/** Crear borrador. */
propuestasRouter.post("/propuestas", requireDemoAuth, asyncHandler(async (req, res) => {
  if (!canWriteProposals(req.demoAuth!.role)) {
    res.status(403).json({ error: "Solo la persona investigadora puede crear propuestas" });
    return;
  }

  if (req.body?.codigo !== undefined) throw new HttpError(400,"El código es automático y no editable");
  const titulo = String(req.body?.titulo ?? "").trim();
  if(titulo.length>500)throw new HttpError(400,"Datos generales: el nombre del proyecto supera los 500 caracteres permitidos. Acórtelo antes de guardar.");
  const idConvocatoria = Number(req.body?.idConvocatoria);
  const modalidadRaw = String(req.body?.modalidad ?? "").trim();
  const modalidad=(await query<{codigo:string}>("SELECT codigo FROM modalidad_catalogo WHERE (codigo=$1 OR nombre=$1) AND activo=true",[MODALIDAD_MAP[modalidadRaw]??modalidadRaw])).rows[0]?.codigo;
  const resumen = req.body?.resumen ? String(req.body.resumen).trim() : null;
  const abstractEn = req.body?.abstractEn
    ? String(req.body.abstractEn).trim()
    : null;
  const problema = req.body?.problema ? String(req.body.problema).trim() : null;
  const objetivoGeneral = req.body?.objetivoGeneral
    ? String(req.body.objetivoGeneral).trim()
    : null;
  const metodologia = req.body?.metodologia
    ? String(req.body.metodologia).trim()
    : null;
  const keywordsEs = parseKeywordInput(req.body?.keywordsEs) ?? [];
  const keywordsEn = parseKeywordInput(req.body?.keywordsEn) ?? [];

  if (!titulo || !Number.isFinite(idConvocatoria) || !modalidad) {
    res.status(400).json({
      error: "titulo, idConvocatoria y modalidad son obligatorios",
    });
    return;
  }

  const conv = await query<{ estado: string }>(
    `SELECT estado FROM convocatoria WHERE id_convocatoria = $1`,
    [idConvocatoria],
  );
  if (!conv.rows[0]) {
    res.status(400).json({ error: "Convocatoria no existe" });
    return;
  }
  if (conv.rows[0].estado !== "activa" && req.demoAuth!.role !== "admin") {
    res.status(400).json({ error: "Solo se puede postular a convocatorias activas" });
    return;
  }

  const userId = req.demoAuth!.userId!;
  const user = await query<{ id_escuela: number | null }>(
    `SELECT id_escuela FROM usuario WHERE id_usuario = $1`,
    [userId],
  );
  const idEscuela = user.rows[0]?.id_escuela;
  if (!idEscuela) {
    res.status(400).json({ error: "El usuario demo no tiene escuela asignada" });
    return;
  }

  const saved = await transaction(async (execute) => {
  const year = Number(new Intl.DateTimeFormat("en", {timeZone:"America/Costa_Rica",year:"numeric"}).format(new Date()));
  const codigo = await siguienteCodigo(execute, year);

  const insert = await execute<{ id_propuesta: number }>(
    `
    INSERT INTO propuesta (
      codigo, id_convocatoria, id_coordinador, id_escuela,
      titulo, modalidad, resumen, abstract_en,
      problema, objetivo_general, metodologia,
      estado_actual, etapa_flujo
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'borrador', 0)
    RETURNING id_propuesta
    `,
    [
      codigo,
      idConvocatoria,
      userId,
      idEscuela,
      titulo.slice(0, 500),
      modalidad,
      resumen,
      abstractEn,
      problema,
      objetivoGeneral,
      metodologia,
    ],
  );

  const id = insert.rows[0].id_propuesta;
  await replaceKeywords(id, keywordsEs, keywordsEn, execute);
  await savePropuestaCampos(id, req.body, execute);

  const detail = await execute<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id, execute);
  return { ...mapPropuesta(detail.rows[0]), ...keywords };
  });
  res.status(201).json(saved);
}));

/** Actualizar borrador. */
propuestasRouter.patch("/propuestas/:id", requireDemoAuth, asyncHandler(async (req, res) => {
  if (!canWriteProposals(req.demoAuth!.role)) {
    res.status(403).json({ error: "Sin permiso para editar propuestas" });
    return;
  }
  const id = Number(req.params.id);
  const existing = await query<{
    id_coordinador: number;
    estado_actual: string;modalidad:string;
  }>(`SELECT id_coordinador, estado_actual, modalidad FROM propuesta WHERE id_propuesta = $1`, [
    id,
  ]);
  const row = existing.rows[0];
  if (!row) {
    res.status(404).json({ error: "Propuesta no encontrada" });
    return;
  }
  if (
    req.demoAuth!.role !== "admin" &&
    row.id_coordinador !== req.demoAuth!.userId
  ) {
    res.status(403).json({ error: "No tenés acceso a esta propuesta" });
    return;
  }
  if (!["borrador", "en_subsanacion"].includes(row.estado_actual)) {
    res.status(400).json({ error: "Solo se editan propuestas en borrador" });
    return;
  }

  await exigirAlcance(id,req.demoAuth!);
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  const set = (col: string, val: unknown) => {
    fields.push(`${col} = $${i++}`);
    values.push(val);
  };

  if (req.body?.titulo !== undefined) {
    const titulo = String(req.body.titulo).trim();
    if(titulo.length>500)throw new HttpError(400,"Datos generales: el nombre del proyecto supera los 500 caracteres permitidos. Acórtelo antes de guardar.");
    if (!titulo) {
      res.status(400).json({ error: "titulo vacío" });
      return;
    }
    set("titulo", titulo.slice(0, 500));
  }
  if (req.body?.modalidad !== undefined) {
    const raw=String(req.body.modalidad).trim();
    const modalidad=(await query<{codigo:string}>("SELECT codigo FROM modalidad_catalogo WHERE (codigo=$1 OR nombre=$1) AND (activo=true OR codigo=$2)",[MODALIDAD_MAP[raw]??raw,row.modalidad])).rows[0]?.codigo;
    if (!modalidad) {
      res.status(400).json({ error: "modalidad inválida" });
      return;
    }
    set("modalidad", modalidad);
  }
  if (req.body?.resumen !== undefined) {
    set(
      "resumen",
      req.body.resumen === null ? null : String(req.body.resumen).trim(),
    );
  }
  if (req.body?.abstractEn !== undefined) {
    set(
      "abstract_en",
      req.body.abstractEn === null ? null : String(req.body.abstractEn).trim(),
    );
  }
  if (req.body?.idConvocatoria !== undefined) {
    set("id_convocatoria", Number(req.body.idConvocatoria));
  }
  if (req.body?.problema !== undefined) {
    set(
      "problema",
      req.body.problema === null ? null : String(req.body.problema).trim(),
    );
  }
  if (req.body?.objetivoGeneral !== undefined) {
    set(
      "objetivo_general",
      req.body.objetivoGeneral === null
        ? null
        : String(req.body.objetivoGeneral).trim(),
    );
  }
  if (req.body?.metodologia !== undefined) {
    set(
      "metodologia",
      req.body.metodologia === null
        ? null
        : String(req.body.metodologia).trim(),
    );
  }

  const saved = await transaction(async (execute) => {
  const locked = await execute<{estado_actual:string}>("SELECT estado_actual FROM propuesta WHERE id_propuesta=$1 FOR UPDATE",[id]);
  if (!locked.rows[0] || !["borrador","en_subsanacion"].includes(locked.rows[0].estado_actual)) throw new HttpError(409,"El expediente ya no está disponible para edición");
  if (req.body?.codigo !== undefined) throw new HttpError(400,"El código es automático y no editable");
  if (locked.rows[0].estado_actual === "en_subsanacion") await validarEdicionSubsanacion(id, req.body, execute);

  if (fields.length > 0) {
    values.push(id);
    await execute(
      `UPDATE propuesta SET ${fields.join(", ")} WHERE id_propuesta = $${i}`,
      values,
    );
  }

  await replaceKeywords(
    id,
    parseKeywordInput(req.body?.keywordsEs),
    parseKeywordInput(req.body?.keywordsEn),
    execute,
  );

  await savePropuestaCampos(id, req.body, execute);
  const detail = await execute<PropuestaRow>(
    `${BASE_SELECT} WHERE p.id_propuesta = $1`,
    [id],
  );
  const keywords = await loadKeywords(id, execute);
  return { ...mapPropuesta(detail.rows[0]), ...keywords };
  });
  res.json(saved);
}));

/** Enviar a revisión (sale de borrador). */
propuestasRouter.post(
  "/propuestas/:id/enviar",
  requireDemoAuth,
  asyncHandler(async (req, res) => {
    if (!canWriteProposals(req.demoAuth!.role)) {
      res.status(403).json({ error: "Sin permiso para enviar propuestas" });
      return;
    }
    const id = Number(req.params.id);
    const existing = await query<{
      id_coordinador: number;
      estado_actual: string;
      titulo: string;
    }>(
      `SELECT id_coordinador, estado_actual, titulo FROM propuesta WHERE id_propuesta = $1`,
      [id],
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ error: "Propuesta no encontrada" });
      return;
    }
    if (
      req.demoAuth!.role !== "admin" &&
      row.id_coordinador !== req.demoAuth!.userId
    ) {
      res.status(403).json({ error: "No tenés acceso a esta propuesta" });
      return;
    }
    if (!["borrador", "en_subsanacion"].includes(row.estado_actual)) {
      res.status(400).json({ error: "La propuesta ya fue enviada" });
      return;
    }
    if (!row.titulo.trim()) {
      res.status(400).json({ error: "Falta el título para enviar" });
      return;
    }

    await exigirAlcance(id,req.demoAuth!);
    const saved = await transaction(async (execute) => {
    const content = await execute<{ resumen: string | null; abstract_en:string|null; declaracion_aceptada: boolean; estado_actual:string }>("SELECT resumen, abstract_en, declaracion_aceptada, estado_actual FROM propuesta WHERE id_propuesta=$1 FOR UPDATE", [id]);
    if (!content.rows[0] || !["borrador","en_subsanacion"].includes(content.rows[0].estado_actual)) throw new HttpError(409,"La propuesta ya fue enviada");
    if (!content.rows[0]?.declaracion_aceptada) throw new HttpError(400,"Debe aceptar la declaración jurada antes de enviar");
    if(!content.rows[0].abstract_en?.trim())throw new HttpError(400,"El abstract en inglés es obligatorio al enviar; keywords EN son opcionales");
    if((await execute("SELECT 1 FROM propuesta_participante pp JOIN propuesta_participante_hora h ON h.id_participante=pp.id_participante WHERE pp.id_propuesta=$1 AND h.tipo_hora='CONS' AND h.cantidad_horas>0 AND COALESCE(trim(pp.titular_cons),'')='' LIMIT 1",[id])).rowCount)throw new HttpError(400,'Identifique la persona titular de las horas CONS');
    if(!content.rows[0].resumen?.trim())throw new HttpError(400,"Resumen en español: complete el resumen antes de enviar la propuesta.");
    const appointments=await execute<{periodo:string|null}>("SELECT periodo_nombramiento AS periodo FROM propuesta_participante WHERE id_propuesta=$1 AND tipo='funcionario_tec'",[id]);
    for(const member of appointments.rows)validarNombramiento(member.periodo,true);
    const wordCount = (content.rows[0]?.resumen ?? "").trim().split(/\s+/u).filter(Boolean).length;
    const terms = await loadKeywords(id,execute);
    if(terms.keywordsEn.length&&(terms.keywordsEn.length<4||terms.keywordsEn.length>6))throw new HttpError(400,'Keywords EN: indique entre 4 y 6 términos en inglés o deje el campo vacío.');
    if (wordCount > 500 || terms.keywordsEs.length < 4 || terms.keywordsEs.length > 6) {
      throw new HttpError(400,"El resumen admite máximo 500 palabras y se requieren entre 4 y 6 términos clave en español.");
    }

    if(content.rows[0].estado_actual==="en_subsanacion") {
      const correction=await cargarSubsanacion(id,execute);
      if(!correction) throw new HttpError(409,"No existe una devolución activa");
      if(!String(req.body?.respuesta??correction.respuesta??"").trim()) throw new HttpError(400,"Explique cómo atendió las observaciones");
      if(correction.secciones.some(code=>!seccionesSubsanacion.find(s=>s.codigo===code)?.campos.some(field=>correction.campos_atendidos.includes(field)))) throw new HttpError(409,"Debe guardar las correcciones de todas las secciones indicadas");
      await execute(`INSERT INTO observacion_respuesta(id_observacion,id_usuario,respuesta,fecha_respuesta)
        SELECT o.id_observacion,$2,$3,NOW() FROM observacion o JOIN propuesta_subsanacion s ON s.id_propuesta=o.id_propuesta AND s.instancia=o.etapa
        WHERE s.id_subsanacion=$1 AND o.fecha_creacion>=s.fecha_devolucion`,[correction.id_subsanacion,req.demoAuth!.userId,String(req.body?.respuesta??correction.respuesta??"").trim()]);
      await execute("UPDATE propuesta_subsanacion SET fecha_reenvio=NOW(),respuesta=$2 WHERE id_subsanacion=$1",[correction.id_subsanacion,String(req.body?.respuesta??correction.respuesta??"").trim()]);
      await execute("UPDATE propuesta SET estado_actual=$2,etapa_flujo=$3 WHERE id_propuesta=$1",[id,correction.estado_retorno,correction.etapa_retorno]);
      await execute("INSERT INTO propuesta_historial_estado(id_propuesta,estado_anterior,estado_nuevo,id_usuario,fecha_hora,observacion) VALUES($1,'en_subsanacion',$2,$3,NOW(),$4)",[id,correction.estado_retorno,req.demoAuth!.userId,`Reenvío a ${correction.instancia}: ${String(req.body?.respuesta??correction.respuesta??"").trim()}`]);
      const detail=await execute<PropuestaRow>(`${BASE_SELECT} WHERE p.id_propuesta=$1`,[id]);
      return {...mapPropuesta(detail.rows[0]),...await loadKeywords(id,execute)};
    }

    await execute(
      `
      UPDATE propuesta
      SET estado_actual = 'enviada',
          etapa_flujo = 1,
          fecha_envio = NOW()
      WHERE id_propuesta = $1
      `,
      [id],
    );
    await execute(
      `
      INSERT INTO propuesta_historial_estado (
        id_propuesta, estado_anterior, estado_nuevo, id_usuario, fecha_hora, observacion
      ) VALUES ($1, 'borrador', 'enviada', $2, NOW(), 'Envío inicial desde el prototipo')
      `,
      [id, req.demoAuth!.userId],
    );

    const detail = await execute<PropuestaRow>(
      `${BASE_SELECT} WHERE p.id_propuesta = $1`,
      [id],
    );
    const keywords = await loadKeywords(id,execute);
    return { ...mapPropuesta(detail.rows[0]), ...keywords };
    });
    res.json(saved);
  }),
);
