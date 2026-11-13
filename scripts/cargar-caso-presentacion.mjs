/**
 * Caso de presentación tomado de Datos_ejemplo_convocatoria_propuesta_CIE.docx.
 * No inventa ORCID, equipo externo ni bibliografía. La persona coordinadora es
 * la cuenta demo que inicia sesión. Queda en borrador para recorrer el formulario.
 */
import { demoProposal } from "./propuestas-demo-data.mjs";

const base = process.env.API_BASE ?? "http://localhost:3000/api";

async function call(route, user, method = "GET", body) {
  const r = await fetch(base + route, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(user
        ? { "X-Demo-User-Id": String(user.id), "X-Demo-Role": user.roleCode }
        : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = r.status === 204 ? null : await r.json();
  if (!r.ok) throw new Error(`${method} ${route}: ${data?.error ?? r.status}`);
  return data;
}

const vie = (
  await call("/demo/login", null, "POST", {
    email: "vie_publicacion@tec.ac.cr",
    password: "prototipo2026",
    roleCode: "vie_publicacion",
  })
).user;
const investigador = (
  await call("/demo/login", null, "POST", {
    email: "investigador@tec.ac.cr",
    password: "prototipo2026",
    roleCode: "investigador",
  })
).user;

const nombreConv =
  "Exposición de Proyectos de Investigación e Innovación 2027";
const existentes = await call("/convocatorias", vie);
let conv = existentes.find((c) => c.nombre === nombreConv);
if (!conv) {
  conv = await call("/convocatorias", vie, "POST", {
    nombre: nombreConv,
    descripcion:
      "Convocatoria de demostración para presentar proyectos de investigación, innovación o acción social en una exposición institucional. Las propuestas seleccionadas tendrían un espacio para mostrar resultados mediante pósteres o demostraciones. Datos de ejemplo; no es una convocatoria institucional.",
    fechaApertura: "2027-03-01",
    fechaCierre: "2027-06-30",
    presupuestoEstimado: 250000,
    estado: "activa",
    hitos: [
      {
        nombre: "Recepción de propuestas",
        responsable: "VIE",
        fechaInicio: "2027-03-01",
        fechaFin: "2027-04-30",
      },
      {
        nombre: "Evaluación y selección de proyectos",
        responsable: "Comité evaluador",
        fechaInicio: "2027-05-03",
        fechaFin: "2027-05-14",
      },
      {
        nombre: "Preparación de pósteres y demostraciones",
        responsable: "Equipos participantes",
        fechaInicio: "2027-05-17",
        fechaFin: "2027-06-18",
      },
      {
        nombre: "Exposición de proyectos",
        responsable: "VIE y equipos participantes",
        fechaInicio: "2027-06-25",
        fechaFin: "2027-06-25",
      },
    ],
  });
}

const titulo =
  "Plataforma interactiva para la visualización y divulgación de proyectos de investigación en exposiciones institucionales";
const propuestas = await call("/propuestas", investigador);
if (propuestas.some((p) => p.titulo === titulo)) {
  console.log("La propuesta de presentación ya existe. No se duplica.");
  console.log(`Convocatoria id=${conv.id} estado=${conv.estado}`);
  process.exit(0);
}

const baseDraft = demoProposal({
  index: 3,
  user: {
    id: investigador.id,
    nombre: investigador.name,
    escuela: "Escuela de Ingeniería en Computación",
  },
  year: 2028,
  batch: "PRESENTACION",
});
const team = {
  ...baseDraft.equipo[0],
  nombre: investigador.name,
  orcid: "",
  iniciales: "PC",
  rol: "Coordinador",
  periodo: "01/01/2028 / 31/12/2028",
  horas: [{ tipo: "VIE", cantidad: 10 }],
};
const payload = {
  ...baseDraft,
  titulo,
  idConvocatoria: conv.id,
  modalidad: "desarrollo_tecnologico",
  fechaInicio: "2028-01-01",
  fechaFin: "2028-12-31",
  trlActual: 5,
  trlEsperado: 5,
  resumen:
    "El proyecto desarrollará una plataforma interactiva para presentar proyectos de investigación en exposiciones institucionales. Permitirá organizar fichas, resultados, recursos visuales y demostraciones en una interfaz accesible para público académico y general. Se diseñará un prototipo, se validará su funcionamiento con datos de prueba y se prepararán lineamientos para su uso en actividades de divulgación. El resultado esperado es una herramienta reutilizable que facilite la comunicación de la investigación y la interacción del público con los proyectos expuestos. Expediente de demostración; no es una solicitud institucional.",
  abstractEn:
    "This demonstration project will develop an interactive platform to present research projects at institutional exhibitions. The platform will organize project profiles, results, visual resources, and demonstrations in an accessible interface. The team will build a prototype, test it with sample data, and prepare guidelines for outreach events. This record is sample data and is not an institutional submission.",
  keywordsEs:
    "divulgación científica, exposición de proyectos, plataforma interactiva, visualización de información, accesibilidad",
  keywordsEn:
    "science communication, project exhibition, interactive platform, information visualization, accessibility",
  problema:
    "En las exposiciones institucionales, la información de proyectos puede presentarse en formatos distintos y depender de materiales impresos o explicaciones individuales. Esto dificulta comparar iniciativas, consultar resultados y mantener la información actualizada. Se necesita una herramienta reutilizable que organice contenidos y permita presentarlos de forma clara, accesible e interactiva.",
  objetivoGeneral:
    "Diseñar, desarrollar y validar un prototipo de plataforma interactiva para divulgar proyectos de investigación en exposiciones institucionales.",
  metodologia:
    "Levantamiento de requisitos; diseño de arquitectura, interfaz y estructura de datos; implementación iterativa; validación técnica con datos sintéticos. Se revisarán navegación, claridad, accesibilidad y pantallas, y se documentarán resultados y limitaciones. Contenido de demostración.",
  estadoArte:
    "Texto de demostración: el caso de ejemplo no incluye una revisión bibliográfica verificada. Antes de una entrega real hay que sustituir este apartado por fuentes comprobables. No usar citas inventadas.",
  referencias:
    "Bibliografía simulada omitida a propósito. El documento de ejemplo indicaba que una lista previa de citas era inventada y no debe presentarse como bibliografía real.",
  equipo: [team],
  presupuesto: [{ anio: 2028, operativo: 4800000, duraderos: 0 }],
  fuentes: [],
  formularioGenerales: {
    ...baseDraft.formularioGenerales,
    q1: "No",
    q2: "No",
    q3: "No",
    q4: "No",
    q5: "No",
    q6: "No",
    q7: "Información de proyectos compartida por unidades participantes, sujeta a autorización; se limitará el acceso y se anonimizará para demostraciones.",
    q8: "Sí",
    q8Oficio: "",
    q9: "Sí",
    trlEsperado: "TRL 5",
  },
  formularioEquipo: { teamTec: [{ ...team, id: "demo-coordinacion" }], teamExternal: [] },
  formularioDeclaracion: {
    declaracionJurada: {
      acepta: true,
      nombreCompleto: investigador.name,
      cedula: "1-0000-0001",
      firma: investigador.name,
    },
  },
};

const created = await call("/propuestas", investigador, "POST", payload);
const template = await fetch(base + "/plantillas/presupuesto", {
  headers: {
    "X-Demo-User-Id": String(investigador.id),
    "X-Demo-Role": "investigador",
  },
});
if (!template.ok) throw new Error("No se pudo obtener la plantilla de presupuesto");
const upload = await fetch(base + `/propuestas/${created.id}/documentos`, {
  method: "POST",
  headers: {
    "X-Demo-User-Id": String(investigador.id),
    "X-Demo-Role": "investigador",
    "Content-Type": "application/octet-stream",
    "X-File-Name": "presupuesto-ejemplo-presentacion.xlsx",
  },
  body: Buffer.from(await template.arrayBuffer()),
});
if (upload.status !== 201) {
  throw new Error("No se adjuntó el presupuesto: " + (await upload.text()));
}

console.log(`Convocatoria ${conv.id} · ${conv.estado} · ${nombreConv}`);
console.log(`Propuesta ${created.codigo} · ${created.estadoActual} · ${created.titulo}`);
console.log("Coordinación:", investigador.name, investigador.email);
console.log("Quedó en borrador. La rúbrica CIE del Word (no recomienda) no se cargó.");
