/** 17 pasos del formulario VIE (HTML prototipo, `const At`). */
export const FORM_WIZARD_STEPS = [
  "Datos y preguntas generales",
  "Resumen y palabras clave",
  "Equipo de investigación",
  "Problema y objetivos",
  "Estado del arte",
  "Metodología",
  "Plan de acción y riesgos",
  "Presupuesto y financiamiento",
  "Compromisos de productos",
  "Resguardo de productos",
  "Divulgación y socialización",
  "Aspectos éticos",
  "Hoja de ruta",
  "Referencias",
  "Declaración jurada",
  "Documentación",
  "Revisión y envío",
] as const;

export type YesNo = "" | "No" | "Sí";
export type GradoVinculo = "" | "No" | "Sí, parcial" | "Sí, totalmente";
export type AmbitoInstrumento = "" | "nacional" | "internacional";
export type TipoInnovacion = "" | "Proceso" | "Producto";
export const TRL_LEVELS = [
  { value: "TRL 1", label: "Principios básicos observados" },
  { value: "TRL 2", label: "Concepto tecnológico formulado" },
  { value: "TRL 3", label: "Prueba experimental de concepto" },
  { value: "TRL 4", label: "Tecnología validada en laboratorio" },
  { value: "TRL 5", label: "Tecnología validada en entorno relevante" },
  { value: "TRL 6", label: "Tecnología demostrada en entorno relevante" },
  { value: "TRL 7", label: "Demostración en entorno operativo real" },
  { value: "TRL 8", label: "Sistema completo y calificado" },
  { value: "TRL 9", label: "Tecnología probada en operación real" },
] as const;
export type NivelTrl = "" | (typeof TRL_LEVELS)[number]["value"];

export const TEAM_HOUR_TYPES = [
  "REC",
  "CONS",
  "DOC VIE",
  "VIESA",
  "VIE-Centro",
] as const;
export type TeamHourType = (typeof TEAM_HOUR_TYPES)[number];

export const TEAM_MEMBER_ROLES = [
  "Coordinador",
  "Investigador",
  "Investigador a contratar",
  "Funcionario administrativo",
  "Estudiante de posgrado",
] as const;
export type TeamMemberRole = (typeof TEAM_MEMBER_ROLES)[number];

export type TeamHourDraft = {
  tipo: TeamHourType | "";
  cantidad: string;
};

export type TeamTecDraft = {
  id: string;
  participantId?: number;
  nombre: string;
  iniciales: string;
  orcid: string;
  instancia: string;
  rol: TeamMemberRole | "";
  horas: TeamHourDraft[];
  periodo: string;
};

export type TeamExternalDraft = {
  id: string;
  participantId?: number;
  nombre: string;
  iniciales: string;
  orcid: string;
  institucion: string;
};

export type SpecificObjectiveDraft = {
  id: string;
  objectiveId?: number;
  descripcion: string;
};

export const PLAN_RESPONSIBILITIES = [
  "Ejecuta",
  "Supervisa",
  "Participa",
] as const;
export type PlanResponsibility = (typeof PLAN_RESPONSIBILITIES)[number];

export type ActionPlanParticipantDraft = {
  id: string;
  teamMemberId: string;
  responsabilidad: PlanResponsibility | "";
};

export type ActionPlanRiskDraft = {
  id: string;
  riesgo: string;
  mitigacion: string;
  responsable: string;
};

export type ActionPlanActivityDraft = {
  id: string;
  activityId?: number;
  objetivoNumero: "" | "1" | "2" | "3";
  actividad: string;
  resultadoEsperado: string;
  participantes: ActionPlanParticipantDraft[];
  riesgos: ActionPlanRiskDraft[];
  mesInicio: string;
  duracionMeses: string;
};

/** Recurso gráfico del paso Documentación (rúbrica: alt text editable). */
export type GraphicResource = {
  id: string;
  tipo: "imagen" | "video";
  nombreArchivo: string;
  /** Texto alternativo / descripción accesible (editable). */
  altText: string;
};

/** Longitud mínima sugerida para una descripción útil (rúbrica a11y). */
export const ALT_TEXT_MIN_CHARS = 40;
export const ESTADO_ARTE_MAX_WORDS = 1000;

export type FormWizardState = {
  titulo: string;
  modalidad: string;
  inicio: string;
  fin: string;
  escuela: string;
  resumen: string;
  palabras: string;
  keywords: string;
  abstract: string;
  q1: YesNo;
  q1Entidad: string;
  q1Estado: string;
  q1Contrapartida: YesNo | "";
  q2: YesNo;
  q2Proyecto: string;
  q2Relacion: string;
  q3: YesNo;
  q3Detalle: string;
  q4: YesNo;
  q4Ambito: AmbitoInstrumento;
  q5: YesNo;
  q5Convenio: string;
  q6: GradoVinculo;
  q6Persona: string;
  q6Programa: string;
  q6Universidad: string;
  q7: YesNo;
  q7Detalle: string;
  q8: YesNo;
  q8Oficio: string;
  q9: YesNo;
  q9Tipo: TipoInnovacion;
  trlEsperado: NivelTrl;
  teamTec: TeamTecDraft[];
  teamExternal: TeamExternalDraft[];
  problema: string;
  objetivoGeneral: string;
  objetivosEspecificos: SpecificObjectiveDraft[];
  estadoArte: string;
  metodologia: string;
  planAccion: ActionPlanActivityDraft[];
  referencias: string;
  declaracion: boolean;
  /** Imágenes y videos con texto alternativo editable. */
  recursosGraficos: GraphicResource[];
};

export const DEFAULT_FORM_WIZARD_STATE: FormWizardState = {
  titulo: "",
  modalidad: "",
  inicio: "",
  fin: "",
  escuela: "",
  resumen: "",
  palabras: "",
  keywords: "",
  abstract: "",
  q1: "",
  q1Entidad: "",
  q1Estado: "",
  q1Contrapartida: "",
  q2: "",
  q2Proyecto: "",
  q2Relacion: "",
  q3: "",
  q3Detalle: "",
  q4: "",
  q4Ambito: "",
  q5: "",
  q5Convenio: "",
  q6: "",
  q6Persona: "",
  q6Programa: "",
  q6Universidad: "",
  q7: "",
  q7Detalle: "",
  q8: "",
  q8Oficio: "",
  q9: "",
  q9Tipo: "",
  trlEsperado: "",
  teamTec: [],
  teamExternal: [],
  problema: "",
  objetivoGeneral: "",
  objetivosEspecificos: [
    { id: "objetivo-especifico-1", descripcion: "" },
    { id: "objetivo-especifico-2", descripcion: "" },
    { id: "objetivo-especifico-3", descripcion: "" },
  ],
  estadoArte: "",
  metodologia: "",
  planAccion: [],
  referencias: "",
  declaracion: false,
  recursosGraficos: [],
};

export type FormStepStatus = "Pendiente" | "En progreso" | "Completa";

function hasText(...values: string[]) {
  return values.every((value) => value.trim().length > 0);
}

function questionIsComplete(answer: YesNo, detailFields: string[]) {
  return (
    (answer === "No" || answer === "Sí") &&
    (answer === "No" || hasText(...detailFields))
  );
}

function stepHasProgress(step: number, form: FormWizardState) {
  switch (step) {
    case 0:
      return Boolean(
        form.titulo ||
          form.modalidad ||
          form.inicio ||
          form.fin ||
          form.escuela ||
          form.q1 ||
          form.q2 ||
          form.q3 ||
          form.q4 ||
          form.q5 ||
          form.q6 ||
          form.q7 ||
          form.q8 ||
          form.q9 ||
          form.trlEsperado,
      );
    case 1:
      return Boolean(
        form.resumen || form.abstract || form.palabras || form.keywords,
      );
    case 2:
      return form.teamTec.length > 0 || form.teamExternal.length > 0;
    case 3:
      return Boolean(
        form.problema ||
          form.objetivoGeneral ||
          form.objetivosEspecificos.some((objective) =>
            objective.descripcion.trim(),
          ),
      );
    case 4:
      return Boolean(form.estadoArte);
    case 5:
      return Boolean(form.metodologia);
    case 6:
      return form.planAccion.some((activity) =>
        Boolean(
          activity.actividad.trim() ||
          activity.resultadoEsperado.trim() ||
          activity.objetivoNumero ||
          activity.participantes.length > 0 ||
          activity.riesgos.some(
            (risk) => risk.riesgo || risk.mitigacion || risk.responsable,
          ),
        ),
      );
    case 13:
      return Boolean(form.referencias);
    case 14:
      return form.declaracion;
    case 15:
      return form.recursosGraficos.length > 0;
    case 16:
      return Array.from({ length: 16 }, (_, index) => index).some(
        (index) => getFormStepStatus(index, form, false) !== "Pendiente",
      );
    default:
      return false;
  }
}

export function getFormStepStatus(
  step: number,
  form: FormWizardState,
  hasConvocatoria: boolean,
): FormStepStatus {
  let complete = false;
  switch (step) {
    case 0: {
      const questionsComplete =
        questionIsComplete(form.q1, [
          form.q1Entidad,
          form.q1Estado,
          form.q1Contrapartida,
        ]) &&
        questionIsComplete(form.q2, [form.q2Proyecto, form.q2Relacion]) &&
        questionIsComplete(form.q3, [form.q3Detalle]) &&
        questionIsComplete(form.q4, [form.q4Ambito]) &&
        questionIsComplete(form.q5, [form.q5Convenio]) &&
        (form.q6 === "No" ||
          (form.q6 !== "" &&
            hasText(form.q6Persona, form.q6Programa, form.q6Universidad))) &&
        questionIsComplete(form.q7, [form.q7Detalle]) &&
        questionIsComplete(form.q8, [form.q8Oficio]) &&
        questionIsComplete(form.q9, [form.q9Tipo]) &&
        (form.modalidad !== "Desarrollo tecnológico" ||
          Boolean(form.trlEsperado));
      complete =
        hasConvocatoria &&
        hasText(form.titulo, form.modalidad, form.inicio, form.fin, form.escuela) &&
        new Date(form.fin) >= new Date(form.inicio) &&
        questionsComplete;
      break;
    }
    case 1: {
      const keywordCount = form.palabras
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean).length;
      complete =
        hasText(form.resumen, form.abstract, form.palabras, form.keywords) &&
        keywordCount >= 4 &&
        keywordCount <= 6;
      break;
    }
    case 2:
      complete =
        form.teamTec.length > 0 &&
        form.teamTec.every(
          (member) =>
            hasText(
              member.nombre,
              member.orcid,
              member.instancia,
              member.rol,
              member.periodo,
            ) &&
            member.horas.length > 0 &&
            member.horas.every(
              (hours) =>
                Boolean(hours.tipo) &&
                Number.isFinite(Number(hours.cantidad)) &&
                Number(hours.cantidad) > 0,
            ),
        ) &&
        form.teamExternal.every((member) =>
          hasText(member.nombre, member.orcid, member.institucion),
        );
      break;
    case 3:
      complete =
        hasText(form.problema, form.objetivoGeneral) &&
        form.objetivosEspecificos.length === 3 &&
        form.objetivosEspecificos.every((objective) =>
          objective.descripcion.trim(),
        );
      break;
    case 4:
      complete =
        hasText(form.estadoArte) &&
        form.estadoArte.trim().split(/\s+/).length <= ESTADO_ARTE_MAX_WORDS;
      break;
    case 5:
      complete = hasText(form.metodologia);
      break;
    case 6:
      complete =
        form.planAccion.length > 0 &&
        form.planAccion.every((activity) => {
          const monthStart = Number(activity.mesInicio);
          const duration = Number(activity.duracionMeses);
          return (
            Boolean(activity.objetivoNumero) &&
            hasText(activity.actividad, activity.resultadoEsperado) &&
            Number.isInteger(monthStart) &&
            Number.isInteger(duration) &&
            monthStart >= 1 &&
            duration >= 1 &&
            monthStart + duration - 1 <= 36 &&
            activity.participantes.length > 0 &&
            activity.participantes.every(
              (participant) =>
                Boolean(participant.teamMemberId) &&
                Boolean(participant.responsabilidad),
            ) &&
            activity.riesgos.length > 0 &&
            activity.riesgos.every((risk) =>
              hasText(risk.riesgo, risk.mitigacion, risk.responsable),
            )
          );
        });
      break;
    case 13:
      complete = hasText(form.referencias);
      break;
    case 14:
      complete = form.declaracion;
      break;
    case 15:
      complete =
        form.recursosGraficos.length > 0 &&
        form.recursosGraficos.every(
          (resource) => resource.altText.trim().length >= ALT_TEXT_MIN_CHARS,
        );
      break;
    case 16:
      complete = Array.from({ length: 16 }, (_, index) => index).every(
        (index) => getFormStepStatus(index, form, hasConvocatoria) === "Completa",
      );
      break;
  }

  if (complete) return "Completa";
  return stepHasProgress(step, form) ? "En progreso" : "Pendiente";
}
