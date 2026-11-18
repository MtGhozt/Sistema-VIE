import type { ReactNode, RefObject, Dispatch, SetStateAction } from "react";
import type { Convocatoria } from "../../api/convocatorias";
import type {
  AcademicProductDraft,
  ActionPlanActivityDraft,
  ActionPlanParticipantDraft,
  ActionPlanRiskDraft,
  AdditionalProductDraft,
  FormWizardState,
  TeamHourDraft,
  TeamTecDraft,
  TechnologyAssetDraft,
} from "../../data/formWizardIan";

export type WizardCatalogos = {
  modalidades: { codigo: string; nombre: string }[];
  lineas: { id_linea_investigacion: number; nombre: string }[];
};

export type WizardStepBag = {
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  readOnly: boolean;
  expandReadOnly: boolean;
  documentos?: ReactNode;
  lineas: number[];
  onIdentificacion: (p: { lineas?: number[] }) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
  bloquearIdentificacion: boolean;
  catalogos: WizardCatalogos;
  error: string;
  q6GroupName: string;
  BUDGET_YEARS: number[];
  collapsedActivities: Record<string, boolean>;
  setCollapsedActivities: Dispatch<SetStateAction<Record<string, boolean>>>;
  pendingRisk: RefObject<{ activityId: string; index: number } | null>;
  patchTeamTec: (id: string, partial: Partial<TeamTecDraft>) => void;
  patchAppointment: (memberId: string, start: string, end: string) => void;
  patchTeamHours: (
    memberId: string,
    index: number,
    partial: Partial<TeamHourDraft>,
  ) => void;
  patchPlanActivity: (
    activityId: string,
    partial: Partial<ActionPlanActivityDraft>,
  ) => void;
  patchPlanParticipant: (
    activityId: string,
    participantId: string,
    partial: Partial<ActionPlanParticipantDraft>,
  ) => void;
  patchPlanRisk: (
    activityId: string,
    riskId: string,
    partial: Partial<ActionPlanRiskDraft>,
  ) => void;
  patchAcademicProduct: (
    id: string,
    partial: Partial<AcademicProductDraft>,
  ) => void;
  patchTechnologyAsset: (
    id: string,
    partial: Partial<TechnologyAssetDraft>,
  ) => void;
  patchAdditionalProduct: (
    id: string,
    partial: Partial<AdditionalProductDraft>,
  ) => void;
};
