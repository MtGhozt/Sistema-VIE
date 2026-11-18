import { apiJson } from "../api/client";
import { useEffect, useState, useId, useRef, type ReactNode } from "react";
import type { Convocatoria } from "../api/convocatorias";
import {
  type ActionPlanActivityDraft,
  type AcademicProductDraft,
  type ActionPlanParticipantDraft,
  type ActionPlanRiskDraft,
  type AdditionalProductDraft,
  type FormWizardState,
  type TeamHourDraft,
  type TeamTecDraft,
  type TechnologyAssetDraft,
} from "../data/formWizardIan";
import { renderWizardStep } from "./formWizard/stepIndex";
import type { WizardStepBag } from "./formWizard/wizardTypes";

type Props = {
  bloquearIdentificacion?: boolean;
  expandReadOnly?: boolean;
  documentos?: ReactNode;
  lineas: number[];
  onIdentificacion: (p: { lineas?: number[] }) => void;
  step: number;
  form: FormWizardState;
  patch: (partial: Partial<FormWizardState>) => void;
  convocatorias: Convocatoria[];
  idConvocatoria: number | "";
  setIdConvocatoria: (v: number | "") => void;
  /** Solo lectura: sin mutaciones; ocultar Agregar/Quitar. */
  readOnly?: boolean;
};

export function FormWizardIan({
  bloquearIdentificacion = false,
  documentos,
  lineas,
  onIdentificacion,
  step,
  form,
  patch: patchProp,
  convocatorias,
  idConvocatoria,
  setIdConvocatoria,
  readOnly = false,
  expandReadOnly = false,
}: Props) {
  const q6GroupName = useId();
  const [catalogos, setCatalogos] = useState<{
    modalidades: { codigo: string; nombre: string }[];
    lineas: { id_linea_investigacion: number; nombre: string }[];
  }>({ modalidades: [], lineas: [] });
  const pendingRisk = useRef<{ activityId: string; index: number } | null>(null);
  useEffect(() => {
    const target = pendingRisk.current;
    if (!target) return;
    const node = document.getElementById(`risk-${target.activityId}-${target.index}`);
    if (node) {
      node.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      node
        .querySelector<HTMLTextAreaElement>("textarea")
        ?.focus({ preventScroll: true });
      pendingRisk.current = null;
    }
  }, [form.planAccion]);
  const [error, setError] = useState("");
  const [collapsedActivities, setCollapsedActivities] = useState<
    Record<string, boolean>
  >({});
  useEffect(() => {
    let mounted = true;
    apiJson<typeof catalogos>("/api/catalogos")
      .then((c) => {
        if (mounted) setCatalogos(c);
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const BUDGET_YEARS = form.presupuestoAnual.map((p) => p.anio);
  const patch = readOnly ? (() => {}) as typeof patchProp : patchProp;

  function patchTeamTec(id: string, partial: Partial<TeamTecDraft>) {
    patch({
      teamTec: form.teamTec.map((member) =>
        member.id === id ? { ...member, ...partial } : member,
      ),
    });
  }

  function patchAppointment(memberId: string, start: string, end: string) {
    patchTeamTec(memberId, { periodo: start || end ? `${start} / ${end}` : "" });
  }

  function patchTeamHours(
    memberId: string,
    index: number,
    partial: Partial<TeamHourDraft>,
  ) {
    patch({
      teamTec: form.teamTec.map((member) =>
        member.id === memberId
          ? {
              ...member,
              horas:
                member.horas.length === 0 && index === 0
                  ? [{ tipo: "", cantidad: "", ...partial }]
                  : member.horas.map((hours, hourIndex) =>
                      hourIndex === index ? { ...hours, ...partial } : hours,
                    ),
            }
          : member,
      ),
    });
  }

  function patchPlanActivity(
    activityId: string,
    partial: Partial<ActionPlanActivityDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId ? { ...activity, ...partial } : activity,
      ),
    });
  }

  function patchPlanParticipant(
    activityId: string,
    participantId: string,
    partial: Partial<ActionPlanParticipantDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              participantes: activity.participantes.map((participant) =>
                participant.id === participantId
                  ? { ...participant, ...partial }
                  : participant,
              ),
            }
          : activity,
      ),
    });
  }

  function patchPlanRisk(
    activityId: string,
    riskId: string,
    partial: Partial<ActionPlanRiskDraft>,
  ) {
    patch({
      planAccion: form.planAccion.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              riesgos: activity.riesgos.map((risk) =>
                risk.id === riskId ? { ...risk, ...partial } : risk,
              ),
            }
          : activity,
      ),
    });
  }

  function patchAcademicProduct(
    id: string,
    partial: Partial<AcademicProductDraft>,
  ) {
    patch({
      productosAcademicos: form.productosAcademicos.map((product) =>
        product.id === id ? { ...product, ...partial } : product,
      ),
    });
  }

  function patchTechnologyAsset(
    id: string,
    partial: Partial<TechnologyAssetDraft>,
  ) {
    patch({
      activosPI: form.activosPI.map((asset) =>
        asset.id === id ? { ...asset, ...partial } : asset,
      ),
    });
  }

  function patchAdditionalProduct(
    id: string,
    partial: Partial<AdditionalProductDraft>,
  ) {
    patch({
      productosAdicionales: form.productosAdicionales.map((product) =>
        product.id === id ? { ...product, ...partial } : product,
      ),
    });
  }

  const ctx: WizardStepBag = {
    form,
    patch,
    readOnly,
    expandReadOnly,
    documentos,
    lineas,
    onIdentificacion,
    convocatorias,
    idConvocatoria,
    setIdConvocatoria,
    bloquearIdentificacion,
    catalogos,
    error,
    q6GroupName,
    BUDGET_YEARS,
    collapsedActivities,
    setCollapsedActivities,
    pendingRisk,
    patchTeamTec,
    patchAppointment,
    patchTeamHours,
    patchPlanActivity,
    patchPlanParticipant,
    patchPlanRisk,
    patchAcademicProduct,
    patchTechnologyAsset,
    patchAdditionalProduct,
  };

  return <>{renderWizardStep(step, ctx)}</>;
}
