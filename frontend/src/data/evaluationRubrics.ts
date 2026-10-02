export type RubricCriterion = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  sectionWeight: number;
  label: string;
  weight: number;
  required: boolean;
  aiScore: number;
  aiReason: string;
};

export type RubricSection = {
  id: string;
  title: string;
  weight: number;
  criteria: Omit<
    RubricCriterion,
    "id" | "sectionId" | "sectionTitle" | "sectionWeight"
  >[];
};

const DESARROLLO: RubricSection[] = [
  {
    id: "grupo",
    title: "1. Grupo investigador",
    weight: 15,
    criteria: [
      {
        label: "Composición disciplinaria del equipo",
        weight: 3,
        required: false,
        aiScore: 8,
        aiReason:
          "El equipo cubre software, sensores y validación.",
      },
      {
        label: "Experiencia en desarrollo tecnológico y productos de innovación",
        weight: 3,
        required: false,
        aiScore: 8,
        aiReason:
          "Hay experiencia previa en prototipos y productos tecnológicos.",
      },
      {
        label: "Participación estudiantil",
        weight: 2,
        required: true,
        aiScore: 8,
        aiReason:
          "Se contempla participación estudiantil mediante modalidad autorizada.",
      },
    ],
  },
  {
    id: "metodologia",
    title: "3. Metodología de desarrollo",
    weight: 15,
    criteria: [
      {
        label:
          "Rigor metodológico del desarrollo tecnológico (enfoque, alcance y diseño)",
        weight: 8,
        required: true,
        aiScore: 8,
        aiReason:
          "El proceso de desarrollo y validación es explícito y trazable.",
      },
      {
        label: "Definición de usuarios/beneficiarios y validación",
        weight: 7,
        required: true,
        aiScore: 8,
        aiReason:
          "Se identifican usuarios y una estrategia de validación en entorno relevante.",
      },
    ],
  },
];

const GENERAL: RubricSection[] = [
  {
    id: "grupo",
    title: "1. Grupo investigador",
    weight: 20,
    criteria: [
      {
        label: "Composición disciplinaria del equipo",
        weight: 5,
        required: false,
        aiScore: 8,
        aiReason:
          "El equipo integra perfiles coherentes con las necesidades técnicas.",
      },
      {
        label: "Experiencia académica del equipo sobre el tema",
        weight: 4,
        required: false,
        aiScore: 8,
        aiReason:
          "Se evidencia experiencia previa y publicaciones relacionadas.",
      },
    ],
  },
  {
    id: "fundamentacion",
    title: "2. Fundamentación",
    weight: 12,
    criteria: [
      {
        label: "Definición y justificación del problema",
        weight: 4,
        required: false,
        aiScore: 8,
        aiReason: "El problema está definido y justificado.",
      },
      {
        label: "Coherencia entre problema y objetivos",
        weight: 4,
        required: true,
        aiScore: 10,
        aiReason: "Los objetivos responden a la necesidad planteada.",
      },
    ],
  },
];

export const RUBRIC_SCORE_OPTIONS = [0, 6, 8, 10] as const;

export const COMMITTEE_EVALUATOR_SUMMARY = [
  ["Coordinador", 88, "Completa"],
  ["Director de Escuela", 90, "Completa"],
  ["Profesor 1", 85, "Completa"],
  ["Profesor 2", 82, "Completa"],
  ["Profesor 3", null, "En progreso"],
] as const;

export function getRubricForModalidad(modalidad: string): RubricCriterion[] {
  const sections =
    modalidad === "Desarrollo tecnológico" ? DESARROLLO : GENERAL;
  return sections.flatMap((section) =>
    section.criteria.map((c, i) => ({
      ...c,
      id: `${section.id}-${i}`,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionWeight: section.weight,
    })),
  );
}

export function getRubricSections(modalidad: string): RubricSection[] {
  return modalidad === "Desarrollo tecnológico" ? DESARROLLO : GENERAL;
}
