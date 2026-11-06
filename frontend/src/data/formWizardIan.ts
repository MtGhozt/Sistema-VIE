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
  "VIE",
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
  titularCons?:string;
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

export const BUDGET_YEARS = [2027, 2028, 2029] as const;
export const FINANCING_TYPES = [
  { value: "externo", label: "Financiamiento externo" },
  { value: "contrapartida", label: "Contrapartida" },
  { value: "cofinanciamiento", label: "Cofinanciamiento" },
] as const;

export type AnnualBudgetDraft = {
  anio: number;
  operativo: string;
  duraderos: string;
};

export type FinancingDraft = {
  tipo: (typeof FINANCING_TYPES)[number]["value"];
  anio1: string;
  anio2: string;
  anio3: string;
  oficio: string;
};

export const BASIC_ACADEMIC_PRODUCTS = [
  {
    value: "opcion_1",
    label:
      "Opción 1: Un artículo científico sometido en revista o conferencia indexada en Web of Science (WoS) o Scopus",
  },
  {
    value: "opcion_2",
    label:
      "Opción 2: Dos artículos científicos sometidos en revistas SciELO, Redalyc, ESCI o DOAJ, o memorias con Consejo Editorial",
  },
  {
    value: "opcion_3",
    label:
      "Opción 3: Un libro o capítulo de libro técnico especializado sometido ante el Comité Editorial permanente",
  },
] as const;

export const TECHNOLOGY_ACADEMIC_PRODUCTS = [
  ...BASIC_ACADEMIC_PRODUCTS,
  {
    value: "opcion_4",
    label:
      "Opción 4: Norma técnica sometida ante entes competentes, o manual técnico de alta especialidad",
  },
] as const;

export const TECHNOLOGY_IP_ASSETS = [
  { value: "activo_1", label: "Activo 1: Patente de invención o modelo de utilidad" },
  { value: "activo_2", label: "Activo 2: Diseño industrial (dibujo o modelo industrial)" },
  {
    value: "activo_3",
    label:
      "Activo 3: Desarrollo de software (código fuente, manuales y ciclo de vida)",
  },
  { value: "activo_4", label: "Activo 4: Secreto depositado en el Centro de Vinculación" },
  { value: "activo_5", label: "Activo 5: Obtención vegetal" },
  { value: "activo_6", label: "Activo 6: Denominación de origen o indicación geográfica" },
  { value: "activo_7", label: "Activo 7: Sistema de trazado de circuitos integrados" },
  { value: "activo_8", label: "Activo 8: Otros, a criterio del Centro de Vinculación" },
] as const;

export type AcademicProductCode =
  | (typeof BASIC_ACADEMIC_PRODUCTS)[number]["value"]
  | "opcion_4";
export type TechnologyAssetCode =
  (typeof TECHNOLOGY_IP_ASSETS)[number]["value"];
export type AcademicProductDraft = {
  id: string;
  codigoOpcion: AcademicProductCode | "";
  cantidad: string;
  objetivoNumero: "" | "1" | "2" | "3";
};
export type TechnologyAssetDraft = {
  id: string;
  codigoOpcion: TechnologyAssetCode | "";
  cantidad: string;
  dictamen: string;
};
export type AdditionalProductDraft = {
  id: string;
  descripcion: string;
};

export type DisseminationDraft = {
  divulgacionCientifica: string;
  canalesInstitucionales: string;
  eventosSocializacion: string;
  mediosMasivos: string;
};

export type EthicalReviewDraft = {
  seresHumanos: YesNo;
  biodiversidad: YesNo;
  animales: YesNo;
  territoriosIndigenas: YesNo;
  consultaConsentimiento: string;
  exencionJustificacion: string;
  entesRegulatorios: string[];
  otroEnte: string;
  detalleAval: string;
};

export type RoadmapDraft = {
  lineaInvestigacion: string;
  objetivoEstrategico: string;
  duracionTotal: string;
  fases: string;
  productosIntermedios: string;
};

export type SwornDeclarationDraft = {
  acepta: boolean;
  nombreCompleto: string;
  cedula: string;
  firma: string;
};

export type ProductSafeguardDraft = {
  depositoRepositorio: YesNo;
  desarrollaSoftwareBaseDatos: YesNo;
  entregaRespaldoSoftware: YesNo;
};

/** Recurso gráfico del paso Documentación (rúbrica: alt text editable). */
export type GraphicResource = {
  id: string;
  tipo: "imagen" | "video";
  nombreArchivo: string;
  /** Texto alternativo / descripción accesible (editable). */
  altText: string;
};

import {
  activityFitsProject,
  isValidProjectDateRange,
  projectDurationMonths,
} from "./dateRules";
import { FIELD_WORD_LIMITS, countWords } from "./textLimits";

/** Longitud mínima sugerida para una descripción útil (rúbrica a11y). */
export const ALT_TEXT_MIN_CHARS = 40;
export {
  ESTADO_ARTE_MAX_WORDS,
  FIELD_WORD_LIMITS,
  countWords,
} from "./textLimits";

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
  presupuestoAnual: AnnualBudgetDraft[];
  financiamiento: FinancingDraft[];
  productosAcademicos: AcademicProductDraft[];
  activosPI: TechnologyAssetDraft[];
  productosAdicionales: AdditionalProductDraft[];
  divulgacion: DisseminationDraft;
  aspectosEticos: EthicalReviewDraft;
  hojaRuta: RoadmapDraft;
  resguardoProductos: ProductSafeguardDraft;
  referencias: string;
  declaracionJurada: SwornDeclarationDraft;
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
  presupuestoAnual: BUDGET_YEARS.map((anio) => ({
    anio,
    operativo: "",
    duraderos: "",
  })),
  financiamiento: FINANCING_TYPES.map(({ value }) => ({
    tipo: value,
    anio1: "",
    anio2: "",
    anio3: "",
    oficio: "",
  })),
  productosAcademicos: [],
  activosPI: [],
  productosAdicionales: [],
  divulgacion: {
    divulgacionCientifica: "",
    canalesInstitucionales: "",
    eventosSocializacion: "",
    mediosMasivos: "",
  },
  aspectosEticos: {
    seresHumanos: "",
    biodiversidad: "",
    animales: "",
    territoriosIndigenas: "",
    consultaConsentimiento: "",
    exencionJustificacion: "",
    entesRegulatorios: [],
    otroEnte: "",
    detalleAval: "",
  },
  hojaRuta: {
    lineaInvestigacion: "",
    objetivoEstrategico: "",
    duracionTotal: "",
    fases: "",
    productosIntermedios: "",
  },
  resguardoProductos: {
    depositoRepositorio: "",
    desarrollaSoftwareBaseDatos: "",
    entregaRespaldoSoftware: "",
  },
  referencias: "",
  declaracionJurada: {
    acepta: false,
    nombreCompleto: "",
    cedula: "",
    firma: "",
  },
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
    case 7:
      return form.presupuestoAnual.some(
        (budget) => budget.operativo.trim() || budget.duraderos.trim(),
      ) || form.financiamiento.some(
        (source) =>
          source.anio1.trim() ||
          source.anio2.trim() ||
          source.anio3.trim() ||
          source.oficio.trim(),
      );
    case 8:
      return (
        form.productosAcademicos.length > 0 ||
        form.activosPI.length > 0 ||
        form.productosAdicionales.some((product) => product.descripcion.trim())
      );
    case 9:
      return Object.values(form.resguardoProductos).some(
        (value) => value !== "",
      );
    case 10:
      return Object.values(form.divulgacion).some((value) => value.trim());
    case 11:
      return (
        form.aspectosEticos.seresHumanos !== "" ||
        form.aspectosEticos.biodiversidad !== "" ||
        form.aspectosEticos.animales !== "" ||
        form.aspectosEticos.territoriosIndigenas !== "" ||
        form.aspectosEticos.exencionJustificacion.trim() !== "" ||
        form.aspectosEticos.entesRegulatorios.length > 0
      );
    case 12:
      return Object.values(form.hojaRuta).some((value) => value.trim());
    case 13:
      return Boolean(form.referencias);
    case 14:
      return (
        form.declaracionJurada.acepta ||
        form.declaracionJurada.nombreCompleto.trim() !== "" ||
        form.declaracionJurada.cedula.trim() !== "" ||
        form.declaracionJurada.firma.trim() !== ""
      );
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

function isValidBudgetAmount(value: string) {
  if (!value.trim()) return true;
  const amount = Number(value);
  return (
    Number.isFinite(amount) &&
    amount >= 0 &&
    amount <= 999999999999.99 &&
    /^\d{1,12}(\.\d{0,2})?$/.test(value.trim())
  );
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
        isValidProjectDateRange(form.inicio, form.fin) &&
        questionsComplete;
      break;
    }
    case 1: {
      const keywordCount = form.palabras
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean).length;
      complete =
        hasText(form.resumen, form.abstract, form.palabras) &&
        keywordCount >= 4 &&
        keywordCount <= 6 &&
        countWords(form.resumen) <= FIELD_WORD_LIMITS.resumen &&
        countWords(form.abstract) <= FIELD_WORD_LIMITS.abstract;
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
        countWords(form.problema) <= FIELD_WORD_LIMITS.problema &&
        countWords(form.objetivoGeneral) <= FIELD_WORD_LIMITS.objetivoGeneral &&
        form.objetivosEspecificos.length === 3 &&
        form.objetivosEspecificos.every(
          (objective) =>
            objective.descripcion.trim() &&
            countWords(objective.descripcion) <=
              FIELD_WORD_LIMITS.objetivoEspecifico,
        );
      break;
    case 4:
      complete =
        hasText(form.estadoArte) &&
        countWords(form.estadoArte) <= FIELD_WORD_LIMITS.estadoArte;
      break;
    case 5:
      complete =
        hasText(form.metodologia) &&
        countWords(form.metodologia) <= FIELD_WORD_LIMITS.metodologia;
      break;
    case 6: {
      const horizon = projectDurationMonths(form.inicio, form.fin);
      complete =
        horizon > 0 &&
        form.planAccion.length > 0 &&
        form.planAccion.every((activity) => {
          const monthStart = Number(activity.mesInicio);
          const duration = Number(activity.duracionMeses);
          return (
            Boolean(activity.objetivoNumero) &&
            hasText(activity.actividad, activity.resultadoEsperado) &&
            Number.isFinite(monthStart) &&
            Number.isFinite(duration) &&
            activityFitsProject(
              monthStart,
              duration,
              form.inicio,
              form.fin,
            ) &&
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
    }
    case 7:
      complete =
        form.presupuestoAnual.some(
          (budget) =>
            Number(budget.operativo || 0) > 0 ||
            Number(budget.duraderos || 0) > 0,
        ) &&
        form.presupuestoAnual.length > 0 &&
        form.presupuestoAnual.every(
          (budget, index) =>
            Number.isInteger(budget.anio) &&
            [budget.operativo, budget.duraderos].every((amount) =>
              isValidBudgetAmount(amount),
            ) &&
            (index === 0 || Number(budget.duraderos || 0) === 0),
        ) &&
        form.financiamiento.length === FINANCING_TYPES.length &&
        form.financiamiento.every((source, index) => {
          const amounts = [source.anio1, source.anio2, source.anio3];
          const hasFunding = amounts.some((amount) => Number(amount || 0) > 0);
          return (
            source.tipo === FINANCING_TYPES[index].value &&
            amounts.every((amount) => isValidBudgetAmount(amount)) &&
            source.oficio.length <= 60 &&
            (!hasFunding || Boolean(source.oficio.trim()))
          );
        });
      break;
    case 8: {
      const weeklyHours = form.teamTec.reduce(
        (total, member) =>
          total +
          member.horas.reduce(
            (memberTotal, hour) =>
              memberTotal + (Number(hour.cantidad) || 0),
            0,
          ),
        0,
      );
      const minimum = Math.ceil(weeklyHours / 10);
      const technologyProject = form.modalidad === "Desarrollo tecnológico";
      const allowedProducts = technologyProject
        ? TECHNOLOGY_ACADEMIC_PRODUCTS
        : BASIC_ACADEMIC_PRODUCTS;
      complete =
        weeklyHours > 0 &&

        form.productosAcademicos.length > 0 &&
        form.productosAcademicos.every(
          (product) =>
            allowedProducts.some(
              (option) => option.value === product.codigoOpcion,
            ) &&
            Number.isInteger(Number(product.cantidad)) &&
            Number(product.cantidad) >= 1 &&
            Number(product.cantidad) <= 99 &&
            ["1", "2", "3"].includes(product.objetivoNumero),
        ) &&
        form.productosAcademicos.reduce(
          (total, product) => total + Number(product.cantidad || 0),
          0,
        ) >= minimum &&
        (technologyProject
          ? form.activosPI.length > 0 &&
            form.activosPI.every(
              (asset) =>
                TECHNOLOGY_IP_ASSETS.some(
                  (option) => option.value === asset.codigoOpcion,
                ) &&
                Number.isInteger(Number(asset.cantidad)) &&
                Number(asset.cantidad) >= 1 &&
                Number(asset.cantidad) <= 99 &&
                Boolean(asset.dictamen.trim()) &&
                asset.dictamen.length <= 40,
            ) &&
            form.activosPI.reduce(
              (total, asset) => total + Number(asset.cantidad || 0),
              0,
            ) +
              form.productosAcademicos.reduce(
                (total, product) => total + Number(product.cantidad || 0),
                0,
              ) >=
              minimum + 1
          : form.productosAdicionales.length <= 2 &&
            form.productosAdicionales.every(
              (product) =>
                product.descripcion.trim().length > 0 &&
                product.descripcion.length <= 500,
            ));
      break;
    }
    case 9:
      complete =
        form.resguardoProductos.depositoRepositorio === "Sí" &&
        (form.resguardoProductos.desarrollaSoftwareBaseDatos === "No" ||
          (form.resguardoProductos.desarrollaSoftwareBaseDatos === "Sí" &&
            form.resguardoProductos.entregaRespaldoSoftware === "Sí"));
      break;
    case 10:
      complete = Object.values(form.divulgacion).every(
        (value) => value.trim().length > 0 && value.length <= 5000,
      );
      break;
    case 11: {
      const ethics = form.aspectosEticos;
      const responses = [
        ethics.seresHumanos,
        ethics.biodiversidad,
        ethics.animales,
        ethics.territoriosIndigenas,
      ];
      const requiresReview = responses.includes("Sí");
      const allNegative = responses.every((response) => response === "No");
      const requiredEntities = [
        ...(ethics.seresHumanos === "Sí" ? ["cec"] : []),
        ...(ethics.biodiversidad === "Sí" ? ["conagebio"] : []),
        ...(ethics.animales === "Sí" ? ["cicua_cobab"] : []),
        ...(ethics.territoriosIndigenas === "Sí" ? ["adi"] : []),
      ];
      complete =
        responses.every((response) => response === "Sí" || response === "No") &&
        (allNegative
          ? ethics.exencionJustificacion.trim().length > 0
          : ethics.entesRegulatorios.length > 0 &&
            requiredEntities.every((entity) =>
              ethics.entesRegulatorios.includes(entity),
            ) &&
            ethics.detalleAval.trim().length > 0 &&
            (!ethics.entesRegulatorios.includes("otro") ||
              ethics.otroEnte.trim().length > 0) &&
            (ethics.territoriosIndigenas !== "Sí" ||
              ethics.consultaConsentimiento.trim().length > 0)) &&
        (!requiresReview || ethics.exencionJustificacion.length <= 5000) &&
        ethics.detalleAval.length <= 5000 &&
        ethics.consultaConsentimiento.length <= 5000 &&
        ethics.otroEnte.length <= 200;
      break;
    }
    case 12:
      complete = Object.values(form.hojaRuta).every(
        (value) => value.trim().length > 0 && value.length <= 5000,
      );
      break;
    case 13:
      complete = hasText(form.referencias);
      break;
    case 14: {
      const declaration = form.declaracionJurada;
      complete =
        declaration.acepta &&
        declaration.nombreCompleto.trim().length > 0 &&
        declaration.cedula.trim().length > 0 &&
        declaration.firma.trim() === declaration.nombreCompleto.trim() &&
        declaration.nombreCompleto.length <= 150 &&
        declaration.cedula.length <= 20;
      break;
    }
    case 15:
      return "En progreso";
      /* Adjuntos autorizados se consultan por API; no inferir completitud de recursos locales.
      complete =
        form.recursosGraficos.length > 0 &&
        form.recursosGraficos.every(
          (resource) => resource.altText.trim().length >= ALT_TEXT_MIN_CHARS,
        );
      break;
      */
    case 16:
      complete = Array.from({ length: 16 }, (_, index) => index).every(
        (index) => getFormStepStatus(index, form, hasConvocatoria) === "Completa",
      );
      break;
  }

  if (complete) return "Completa";
  return stepHasProgress(step, form) ? "En progreso" : "Pendiente";
}
