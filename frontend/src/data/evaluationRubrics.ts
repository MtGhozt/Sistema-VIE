import prototypes from "../../../shared/rubricas-prototipo.json";
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

const DESARROLLO: RubricSection[] = prototypes.desarrollo;
const GENERAL: RubricSection[] = prototypes.general;

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
