import type { EvaluacionBandejaItem } from "../api/evaluaciones";
import type { DemoProposal } from "../data/demo";

export type BandejaEntry = {
  key: string;
  numericId: number | null;
  demo: DemoProposal;
  api: EvaluacionBandejaItem | null;
};
