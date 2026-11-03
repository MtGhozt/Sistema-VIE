import { useEffect, useMemo, useState } from "react";
import { ApiError } from "../../api/client";
import {
  fetchAiRubricSuggestion,
  type AiRubricSuggestionResponse,
  fetchOfficialRubric,
  fetchSavedIndividualEvaluation,
  type OfficialRubricResponse,
} from "../../api/evaluaciones";
import type { DemoProposal } from "../../data/demo";
import {
  COMMITTEE_EVALUATOR_SUMMARY,
  RUBRIC_SCORE_OPTIONS,
  getRubricForModalidad,
  getRubricSections,
} from "../../data/evaluationRubrics";
import { IconClipboard, IconFile, IconShield } from "../icons";
import { ProcessTimeline } from "../ProcessTimeline";
import { CaseFile } from "./CaseFile";
import { SimpleModal } from "./SimpleModal";

function PanelIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="section-title" style={{ marginBottom: 16 }}>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

type ActionHandler = (
  action: string,
  payload?: unknown,
) => void | Promise<void>;

function CheckIcon() {
  // Decorativo: el estado ya lo anuncia el texto "Verificado" / "Falta verificar".
  return (
    <span className="custom-check" aria-hidden="true">
      ✓
    </span>
  );
}

export function VinculacionPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const [form, setForm] = useState({
    potencial: "Sí",
    tipoActivo: proposal.activoPI || "Desarrollo de Software",
    tipoPI: "Derecho de autor sobre software / posible secreto empresarial",
    innovacion: "Sí",
    novedad:
      "La integración propuesta combina sensórica, comunicaciones y analítica en una solución orientada al contexto de monitoreo rural.",
    titularidad:
      "Resultados desarrollados en el marco institucional del TEC, sujetos a la normativa institucional de propiedad intelectual.",
    divulgacion:
      "No divulgar código fuente, arquitectura detallada ni resultados potencialmente protegibles antes de definir la estrategia de protección.",
    confidencialidad:
      proposal.confidencialidad === "Sí"
        ? "La propuesta declara información sensible; mantener controles de acceso y acuerdos de confidencialidad."
        : "No se reporta información sensible de terceros.",
    analisis:
      "La propuesta presenta resultados con potencial de protección asociados al software, documentación técnica y conocimiento generado durante la integración del prototipo.",
    recomendaciones:
      "Registrar autoría, conservar evidencias de desarrollo y coordinar con Vinculación cualquier divulgación previa a la definición de la estrategia de protección.",
    oficio: proposal.oficioPI || "CV-023-2026",
    fecha: "2026-08-23",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="split-review pi-review-layout">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Dictamen técnico de Propiedad Intelectual"
          description="Documento técnico del Centro de Vinculación. Su resultado se incorpora al expediente y el flujo continúa hacia el Comité Técnico."
        />
        <div className="pi-scope-note">
          <IconShield size={17} />
          <span>
            Este dictamen analiza el potencial y la gestión de PI.{" "}
            <strong>
              No sustituye la evaluación académica ni decide la aprobación
              general de la propuesta.
            </strong>
          </span>
        </div>
        <div className="stack-md">
          <div className="form-grid two-col">
            <label className="field">
              <span className="field-label">¿Existe potencial de protección?</span>
              <select
                className="input"
                value={form.potencial}
                onChange={(e) => set("potencial", e.target.value)}
              >
                <option>Sí</option>
                <option>No</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">
                ¿El resultado se considera innovador?
              </span>
              <select
                className="input"
                value={form.innovacion}
                onChange={(e) => set("innovacion", e.target.value)}
              >
                <option>Sí</option>
                <option>No</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">Resultado o activo identificable</span>
              <input
                className="input"
                value={form.tipoActivo}
                onChange={(e) => set("tipoActivo", e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Mecanismo de PI considerado</span>
              <input
                className="input"
                value={form.tipoPI}
                onChange={(e) => set("tipoPI", e.target.value)}
              />
            </label>
          </div>
          {(
            [
              ["novedad", "Novedad / elementos diferenciadores", 4],
              ["titularidad", "Titularidad y participación institucional", 3],
              [
                "divulgacion",
                "Recomendaciones antes de divulgación pública",
                3,
              ],
              [
                "confidencialidad",
                "Confidencialidad / información de terceros",
                3,
              ],
              ["analisis", "Análisis técnico", 5],
              [
                "recomendaciones",
                "Recomendaciones del Centro de Vinculación",
                4,
              ],
            ] as const
          ).map(([key, label, rows]) => (
            <label key={key} className="field">
              <span className="field-label">{label}</span>
              <textarea
                className="input textarea"
                rows={rows}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <div className="form-grid two-col">
            <label className="field">
              <span className="field-label">Número de oficio</span>
              <input
                className="input"
                value={form.oficio}
                onChange={(e) => set("oficio", e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Fecha</span>
              <input
                className="input"
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha", e.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAction("pi", form)}
          >
            Emitir y registrar dictamen
          </button>
        </div>
      </article>
    </div>
  );
}

export function ComiteAsistentePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const initial = Object.fromEntries(
    proposal.documentos.map((d) => [
      d.nombre,
      d.estado === "Completo" || d.estado === "No requerido",
    ]),
  );
  const [checks, setChecks] = useState(initial);
  const [returnOpen, setReturnOpen] = useState(false);
  const [motivo, setMotivo] = useState(
    "Falta completar documentación requerida por el Comité Técnico.",
  );
  const allOk = Object.values(checks).every(Boolean);

  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Checklist de completitud"
          description="Verifique la documentación formal antes de iniciar la evaluación técnica."
        />
        <div className="checklist" role="group" aria-label="Checklist de completitud">
          {Object.entries(checks).map(([name, ok]) => (
            <label key={name} className="check-row">
              <input
                type="checkbox"
                checked={ok}
                onChange={() =>
                  setChecks((c) => ({ ...c, [name]: !c[name] }))
                }
              />
              {ok ? <CheckIcon /> : <span className="custom-check" />}
              <div>
                <strong>{name}</strong>
                <span>{ok ? "Verificado" : "Falta verificar"}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="action-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setReturnOpen(true)}
          >
            Devolver con observaciones
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allOk}
            onClick={() => onAction("committee-ready")}
          >
            Enviar a evaluación
          </button>
        </div>
        <SimpleModal
          open={returnOpen}
          title="Devolver propuesta"
          description="Registre claramente los faltantes que debe atender la persona investigadora."
          onClose={() => setReturnOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReturnOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onAction("return", { texto: motivo });
                  setReturnOpen(false);
                }}
              >
                Devolver propuesta
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">Motivo</span>
            <textarea
              className="input textarea"
              rows={5}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
        </SimpleModal>
      </article>
    </div>
  );
}

function RubricPanel({
  proposal,
  onAction,
  cie = false,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
  cie?: boolean;
}) {
  const criteria = useMemo(
    () => getRubricForModalidad(proposal.modalidad),
    [proposal.modalidad],
  );
  const sections = useMemo(
    () => getRubricSections(proposal.modalidad),
    [proposal.modalidad],
  );

  const [scores, setScores] = useState(() =>
    Object.fromEntries(
      criteria.map((c) => [
        c.id,
        {
          score: proposal.databaseId ? null : c.aiScore,
          reason:
            !proposal.databaseId && c.aiScore >= 8
              ? "La evidencia del expediente satisface el criterio; se conserva la valoración sugerida después de revisión humana."
              : "",
        },
      ]),
    ),
  );
  const [aiResult, setAiResult] = useState<AiRubricSuggestionResponse | null>(null);
  const [officialRubric, setOfficialRubric] = useState<OfficialRubricResponse | null>(null);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [productsCompliance, setProductsCompliance] = useState<
    "cumple" | "no_cumple" | "indeterminado"
  >("indeterminado");
  const [productsJustification, setProductsJustification] = useState("");

  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [approveText, setApproveText] = useState("");

  useEffect(() => {
    if (!proposal.databaseId || cie) return;
    let active = true;
    setRubricLoading(true);
    setOfficialRubric(null);
    setAiResult(null);
    setProductsCompliance("indeterminado");
    setProductsJustification("");
    setAiError("");
    setScores({});
    void Promise.all([
      fetchOfficialRubric(proposal.databaseId),
      fetchSavedIndividualEvaluation(proposal.databaseId),
    ])
      .then(([{ rubric }, { evaluation }]) => {
        if (!active) return;
        setOfficialRubric(rubric);
        setScores(
          Object.fromEntries(
            rubric.criteria.map((criterion) => [
              criterion.id,
              evaluation?.scores[criterion.id] ?? { score: null, reason: "" },
            ]),
          ),
        );
        if (evaluation) {
          setProductsCompliance(evaluation.productsCompliance);
          setProductsJustification(evaluation.productsJustification);
          setAiResult(
            evaluation.aiSuggestions.length > 0
              ? {
                  rubric,
                  suggestion: {
                    criteria: evaluation.aiSuggestions,
                    productsCompliance: evaluation.aiProductsCompliance,
                    summary: evaluation.aiSummary,
                    model: evaluation.aiModel,
                  },
                  weightedScore: 0,
                  recommendation: "NO RECOMIENDA",
                }
              : null,
          );
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAiError(
          error instanceof ApiError || error instanceof Error
            ? error.message
            : "No se pudo cargar la rúbrica oficial.",
        );
      })
      .finally(() => {
        if (active) setRubricLoading(false);
      });
    return () => {
      active = false;
    };
  }, [proposal.databaseId, cie]);

  const activeRubric = aiResult?.rubric ?? officialRubric;
  const aiSuggestions = aiResult?.suggestion.criteria ?? [];
  const displayCriteria = activeRubric
    ? activeRubric.criteria.map((criterion) => {
        const suggestion = aiSuggestions.find((item) => item.id === criterion.id);
        return {
          id: criterion.id,
          sectionId: criterion.section,
          sectionTitle: criterion.section,
          sectionWeight: 0,
          label: criterion.name,
          weight: criterion.weight * 100,
          required: criterion.required,
          aiScore: suggestion?.score ?? null,
          aiReason: suggestion?.justification ?? "Aún no se ha generado una sugerencia de IA.",
          evidence: suggestion?.evidence ?? "",
          missingInformation: suggestion?.missingInformation ?? "",
        };
      })
    : criteria.map((criterion) => ({
        ...criterion,
        aiScore: proposal.databaseId ? null : criterion.aiScore,
        aiReason: proposal.databaseId
          ? "Aún no se ha generado una sugerencia de IA."
          : criterion.aiReason,
        evidence: "",
        missingInformation: "",
      }));
  const displaySections = activeRubric
    ? [...new Set(displayCriteria.map((criterion) => criterion.sectionId))].map(
        (sectionTitle) => ({
          id: sectionTitle,
          title: sectionTitle,
          weight: displayCriteria
            .filter((criterion) => criterion.sectionId === sectionTitle)
            .reduce((total, criterion) => total + criterion.weight, 0),
          criteria: displayCriteria.filter(
            (criterion) => criterion.sectionId === sectionTitle,
          ),
        }),
      )
    : sections.map((section) => ({
        ...section,
        criteria: displayCriteria.filter(
          (criterion) => criterion.sectionId === section.id,
        ),
      }));
  const totalWeight = displayCriteria.reduce((total, criterion) => total + criterion.weight, 0);
  const weighted = displayCriteria.reduce((total, criterion) => {
    const score = scores[criterion.id]?.score ?? 0;
    return total + criterion.weight * (score / 10);
  }, 0);
  const average = totalWeight > 0 ? Math.round((weighted / totalWeight) * 1000) / 10 : 0;
  const failedRequired = displayCriteria.filter(
    (criterion) => criterion.required && (scores[criterion.id]?.score ?? 0) < 6,
  );
  const allScored = displayCriteria.every(
    (criterion) => scores[criterion.id]?.score !== null && scores[criterion.id]?.score !== undefined,
  );
  const allJustified = displayCriteria.every((criterion) =>
    String(scores[criterion.id]?.reason ?? "").trim(),
  );
  const recommendation =
    activeRubric && productsCompliance === "indeterminado"
      ? "REVISAR PRODUCTOS"
      : average >= 70 && failedRequired.length === 0 && productsCompliance !== "no_cumple"
      ? "RECOMIENDA"
      : "NO RECOMIENDA";

  async function generateAiSuggestion() {
    if (!proposal.databaseId) {
      setAiError("Las sugerencias IA requieren una propuesta cargada desde PostgreSQL.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const result = await fetchAiRubricSuggestion(proposal.databaseId);
      setAiResult(result);
      setScores(
        Object.fromEntries(
          result.suggestion.criteria.map((item) => [
            item.id,
            { score: null, reason: "" },
          ]),
        ),
      );
    } catch (error) {
      setAiError(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "No se pudo generar la sugerencia de IA.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  function evaluationPayload() {
    return {
      average,
      scores,
      recommendation,
      aiScores: Object.fromEntries(
        (aiResult?.suggestion.criteria ?? []).map((item) => [item.id, item.score]),
      ),
      aiSuggestions: aiResult?.suggestion.criteria ?? [],
      aiProductsCompliance: aiResult?.suggestion.productsCompliance ?? null,
      aiModel: aiResult?.suggestion.model ?? "",
      productsCompliance,
      productsJustification,
      aiSummary: aiResult?.suggestion.summary ?? "",
    };
  }

  return (
    <div className="rubric-layout">
      <article className="card rubric-case">
        <CaseFile proposal={proposal} />
      </article>
      <div className="rubric-main">
        <div className="rubric-summary">
          <div>
            <p className="eyebrow">
              {cie ? "Rúbrica CIE" : "Evaluación individual"}
            </p>
            <h2>
              {cie
                ? "Evaluación y resolución del CIE"
                : `${proposal.databaseId ? "Rúbrica oficial" : "Rúbrica de demostración"} · ${proposal.modalidad}`}
            </h2>
            <p>
              {proposal.databaseId
                ? "Escala oficial: 0, 6, 8 o 10. La IA ofrece apoyo; la decisión y valoración final son humanas."
                : "Puntajes de ejemplo locales; no corresponden a una evaluación oficial ni se guardan en PostgreSQL."}
            </p>
          </div>
          {!cie && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void generateAiSuggestion()}
              disabled={aiLoading || rubricLoading || !proposal.databaseId}
            >
              {aiLoading
                ? "Analizando propuesta..."
                : rubricLoading
                  ? "Cargando rúbrica..."
                  : "Generar sugerencias IA"}
            </button>
          )}
          <div className="score-ring">
            <strong>{average}</strong>
            <span>/ 100</span>
            <small>{recommendation}</small>
          </div>
        </div>

        {!cie && (
          <article className="card evaluator-summary">
            <PanelIntro
              title="Evaluaciones independientes del Comité"
              description="Cinco integrantes registran su evaluación por separado antes de consolidar el oficio."
            />
            <div className="evaluator-grid">
              {COMMITTEE_EVALUATOR_SUMMARY.map(([name, score, status]) => (
                <div key={name}>
                  <span>{name}</span>
                  <strong>{score ?? "—"}</strong>
                  <span
                    className={
                      status === "Completa"
                        ? "badge badge-primary"
                        : "badge"
                    }
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </article>
        )}

        <div className="rubric-alert" aria-live="polite">
          <IconClipboard size={17} />
          <span>
            <strong>Sugerencia de IA:</strong> siempre editable. Ningún puntaje
            se confirma automáticamente.
          </span>
        </div>
        {aiError && <p className="field-hint" role="alert">{aiError}</p>}
        {aiResult && (
          <div className="ai-box">
            <strong>Lectura general · {aiResult.suggestion.model}</strong>
            <p>{aiResult.suggestion.summary}</p>
            <p>
              Productos académicos (no sumativos): {aiResult.suggestion.productsCompliance.status}
              {aiResult.suggestion.productsCompliance.justification
                ? ` · ${aiResult.suggestion.productsCompliance.justification}`
                : ""}
            </p>
          </div>
        )}

        {displaySections.map((section) => (
          <section key={section.id} className="rubric-section">
            <div className="rubric-section-head">
              <div>
                <h3>{section.title}</h3>
                <span>Peso total de la sección: {section.weight}%</span>
              </div>
            </div>
            {section.criteria.map((full) => {
              const id = full.id;
              const row = scores[id];
              return (
                <article key={id} className="card criterion">
                  <div className="criterion-head">
                    <div>
                      <strong>{full.label}</strong>
                      <span>
                        Peso {full.weight.toFixed(1)}%{" "}
                        {full.required ? "· Requisito obligatorio" : ""}
                      </span>
                    </div>
                    <span className="badge">
                      {full.aiScore == null
                        ? "Sin sugerencia IA"
                        : `Sugerencia IA: ${full.aiScore}/10`}
                    </span>
                  </div>
                  <div className="ai-box">
                    <strong>Sugerencia de IA</strong>
                    <p>{full.aiReason}</p>
                    {full.evidence && (
                      <p><strong>Evidencia:</strong> {full.evidence}</p>
                    )}
                    {full.missingInformation && (
                      <p><strong>Información faltante:</strong> {full.missingInformation}</p>
                    )}
                  </div>
                  <div className="human-eval">
                    <label className="field" htmlFor={`valoracion-${id}`}>
                      <span className="field-label">Valoración humana</span>
                      <select
                        id={`valoracion-${id}`}
                        className="input"
                        value={row?.score ?? ""}
                        onChange={(e) =>
                          setScores((s) => ({
                            ...s,
                            [id]: {
                              ...s[id],
                              score: e.target.value === "" ? null : Number(e.target.value),
                            },
                          }))
                        }
                      >
                        {row?.score == null && (
                          <option value="">Seleccione una calificación</option>
                        )}
                        {RUBRIC_SCORE_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n} / 10
                          </option>
                        ))}
                      </select>
                    </label>
                    <label
                      className="field"
                      htmlFor={`justificacion-${id}`}
                    >
                      <span className="field-label">
                        Justificación humana obligatoria
                      </span>
                      <textarea
                        id={`justificacion-${id}`}
                        className="input textarea"
                        rows={3}
                        value={row?.reason ?? ""}
                        placeholder="Justifique la valoración con evidencia del expediente..."
                        onChange={(e) =>
                          setScores((s) => ({
                            ...s,
                            [id]: { ...s[id], reason: e.target.value },
                          }))
                        }
                      />
                    </label>
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        {!cie && activeRubric && (
          <article className="card criterion">
            <PanelIntro
              title="Productos académicos · requisito no sumativo"
              description="Esta verificación no agrega puntos. La persona evaluadora confirma el cumplimiento con base en los productos declarados y las disposiciones de la convocatoria."
            />
            {aiResult && (
              <div className="ai-box">
                <strong>Sugerencia IA: {aiResult.suggestion.productsCompliance.status}</strong>
                <p>{aiResult.suggestion.productsCompliance.justification}</p>
                {aiResult.suggestion.productsCompliance.evidence && (
                  <p><strong>Evidencia:</strong> {aiResult.suggestion.productsCompliance.evidence}</p>
                )}
              </div>
            )}
            <div className="human-eval">
              <label className="field" htmlFor="productos-cumplimiento">
                <span className="field-label">Verificación humana</span>
                <select
                  id="productos-cumplimiento"
                  className="input"
                  value={productsCompliance}
                  onChange={(event) =>
                    setProductsCompliance(event.target.value as typeof productsCompliance)
                  }
                >
                  <option value="indeterminado">Pendiente de verificar</option>
                  <option value="cumple">Cumple</option>
                  <option value="no_cumple">No cumple</option>
                </select>
              </label>
              <label className="field" htmlFor="productos-justificacion">
                <span className="field-label">Justificación humana</span>
                <textarea
                  id="productos-justificacion"
                  className="input textarea"
                  rows={3}
                  value={productsJustification}
                  onChange={(event) => setProductsJustification(event.target.value)}
                  placeholder="Indique productos declarados y requisito aplicado..."
                />
              </label>
            </div>
          </article>
        )}

        <article className="card rubric-result-card">
          <div>
            <span>Calificación ponderada</span>
            <strong>{average}%</strong>
          </div>
          <div>
            <span>Resultado de referencia</span>
            <strong>{recommendation}</strong>
          </div>
          <div>
            <span>Requisitos obligatorios bajo mínimo</span>
            <strong>{failedRequired.length}</strong>
          </div>
        </article>

        <div className="action-row end">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onAction("save-rubric", evaluationPayload())}
          >
            Guardar evaluación
          </button>
          {cie ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectOpen(true)}
              >
                Rechazar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allJustified || recommendation === "NO RECOMIENDA"}
                onClick={() => setApproveOpen(true)}
              >
                Aprobar y emitir resolución
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={
                !allScored ||
                !allJustified ||
                (Boolean(activeRubric) &&
                  (productsCompliance === "indeterminado" || !productsJustification.trim()))
              }
              onClick={() => onAction("committee-score", evaluationPayload())}
            >
              Completar evaluación
            </button>
          )}
        </div>

        <SimpleModal
          open={rejectOpen}
          title="Emitir resolución de rechazo"
          description="Registre el fundamento que acompañará la resolución del CIE."
          onClose={() => setRejectOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!rejectText.trim()}
                onClick={() => {
                  onAction("cie-reject", {
                    average,
                    scores,
                    motivo: rejectText.trim(),
                  });
                  setRejectOpen(false);
                }}
              >
                Confirmar rechazo
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación del rechazo (obligatoria)
            </span>
            <textarea
              className="input textarea"
              rows={6}
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Fundamento de la resolución de rechazo..."
            />
          </label>
        </SimpleModal>

        <SimpleModal
          open={approveOpen}
          title="Aprobar y emitir resolución"
          description={`Propuesta ${proposal.id} · Calificación ${average}% · Resultado: ${recommendation}`}
          onClose={() => setApproveOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!approveText.trim()}
                onClick={() => {
                  onAction("cie-approve", {
                    average,
                    scores,
                    recommendation,
                    motivo: approveText.trim(),
                  });
                  setApproveOpen(false);
                }}
              >
                Confirmar aprobación
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación de la aprobación (obligatoria)
            </span>
            <textarea
              className="input textarea"
              rows={6}
              value={approveText}
              onChange={(e) => setApproveText(e.target.value)}
              placeholder="Fundamento de la resolución aprobatoria..."
            />
          </label>
        </SimpleModal>
      </div>
    </div>
  );
}

export function ComiteEvaluadorPanel(props: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  return <RubricPanel {...props} />;
}

export function CiePanel(props: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  return <RubricPanel {...props} cie />;
}

export function ConsejoAsistentePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const avg = proposal.evaluacionComite?.average ?? 87;
  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Preparar expediente para sesión"
          description="Verifique que el expediente recibido del Comité esté listo para el Consejo."
        />
        <div className="document-list compact">
          <div className="document-row">
            <IconClipboard size={18} />
            <div>
              <strong>Calificación del Comité Técnico</strong>
              <span>{avg}% · consolidada</span>
            </div>
            <span className="badge badge-primary">Recibida</span>
          </div>
          <div className="document-row">
            <IconFile size={18} />
            <div>
              <strong>Oficio del Comité</strong>
              <span>{proposal.oficioComite || "CT-041-2026"}</span>
            </div>
            <span className="badge badge-primary">Adjunto</span>
          </div>
          <div className="document-row">
            <IconShield size={18} />
            <div>
              <strong>Dictamen de PI</strong>
              <span>
                {proposal.piRequired
                  ? proposal.oficioPI || "CV-023-2026"
                  : "No requerido"}
              </span>
            </div>
            <span className="badge badge-primary">Verificado</span>
          </div>
        </div>
        <label className="field">
          <span className="field-label">Sesión del Consejo</span>
          <select className="input" defaultValue="0">
            <option>Sesión ordinaria — 22 Sep 2026</option>
            <option>Sesión extraordinaria — 25 Sep 2026</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onAction("send-council")}
        >
          Enviar al Consejo
        </button>
      </article>
    </div>
  );
}

export function ConsejoPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const avg = proposal.evaluacionComite?.average ?? 87;
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectText, setRejectText] = useState("");
  const [approveText, setApproveText] = useState("");

  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Decisión del Consejo de Profesores"
          description="Revise el expediente consolidado, la evaluación del Comité y los oficios de respaldo."
        />
        <div className="decision-score">
          <span>Calificación consolidada del Comité</span>
          <strong>{avg}%</strong>
        </div>
        <div className="document-list compact">
          <div className="document-row">
            <IconFile size={18} />
            <div>
              <strong>Oficio del Comité Técnico</strong>
              <span>{proposal.oficioComite || "CT-041-2026"}</span>
            </div>
            <span className="badge">Disponible</span>
          </div>
          <div className="document-row">
            <IconShield size={18} />
            <div>
              <strong>Dictamen de Propiedad Intelectual</strong>
              <span>
                {proposal.piRequired
                  ? proposal.oficioPI || "CV-023-2026"
                  : "No requerido"}
              </span>
            </div>
            <span className="badge">Verificado</span>
          </div>
        </div>
        {proposal.justificacionAval && (
          <div className="justification-box">
            <strong>Justificación de aval registrada</strong>
            <p>{proposal.justificacionAval}</p>
          </div>
        )}
        <div className="action-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRejectOpen(true)}
          >
            Rechazar aval
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setApproveOpen(true)}
          >
            Aprobar aval
          </button>
        </div>
        <SimpleModal
          open={rejectOpen}
          title="Rechazar aval"
          description="El rechazo detendrá el avance de la propuesta hacia VIE."
          onClose={() => setRejectOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRejectOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!rejectText.trim()}
                title={
                  rejectText.trim()
                    ? "Registrar rechazo de aval"
                    : "Escriba la justificación para habilitar Confirmar"
                }
                onClick={() => {
                  void onAction("council-reject", {
                    texto: rejectText.trim(),
                  });
                  setRejectOpen(false);
                  setRejectText("");
                }}
              >
                Confirmar rechazo
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación del rechazo (obligatoria)
            </span>
            <textarea
              className="input textarea"
              rows={5}
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              required
            />
          </label>
          {!rejectText.trim() && (
            <p className="field-hint" role="status">
              Escriba la justificación para habilitar «Confirmar rechazo».
            </p>
          )}
        </SimpleModal>
        <SimpleModal
          open={approveOpen}
          title="Aprobar aval"
          description={`Propuesta ${proposal.id} · Registre la justificación de la aprobación.`}
          onClose={() => setApproveOpen(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApproveOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!approveText.trim()}
                title={
                  approveText.trim()
                    ? "Registrar aval aprobatorio"
                    : "Escriba la justificación para habilitar Confirmar"
                }
                onClick={() => {
                  void onAction("council-approve", {
                    texto: approveText.trim(),
                  });
                  setApproveOpen(false);
                  setApproveText("");
                }}
              >
                Confirmar aprobación
              </button>
            </>
          }
        >
          <label className="field">
            <span className="field-label">
              Justificación de la aprobación (obligatoria)
            </span>
            <textarea
              className="input textarea"
              rows={5}
              value={approveText}
              onChange={(e) => setApproveText(e.target.value)}
              placeholder="Explique por qué se otorga el aval..."
              required
            />
          </label>
          {!approveText.trim() && (
            <p className="field-hint" role="status">
              Escriba la justificación para habilitar «Confirmar aprobación».
            </p>
          )}
        </SimpleModal>
      </article>
    </div>
  );
}

export function DireccionEscuelaPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Comunicar aval a VIE"
          description="El aval fue aprobado por el Consejo y está listo para comunicación formal."
        />
        <div className="official-doc">
          <IconFile size={24} />
          <div>
            <span>Oficio de aval</span>
            <strong>{proposal.oficioAval || "ESC-COMP-117-2026"}</strong>
            <small>Consejo de la Escuela de Ingeniería en Computación</small>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <span>Destinatario</span>
            <strong>Vicerrectoría de Investigación y Extensión</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>Pendiente de comunicar</strong>
          </div>
        </div>
        <div className="action-stack">
          <button type="button" className="btn btn-secondary">
            Vista previa del memorando (IC-467)
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAction("communicate-aval")}
          >
            Generar documento y comunicar a VIE
          </button>
        </div>
      </article>
    </div>
  );
}

export function GestoraViePanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const items = [
    "Propuesta completa",
    "Dictamen PI o constancia de no requerido",
    "Evaluación del Comité",
    "Oficio del Comité",
    "Aval del Consejo",
    "Documentos de respaldo",
  ];
  const [obs, setObs] = useState("");

  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Verificación VIE"
          description="Confirme que el expediente contiene la ruta previa y la documentación necesaria."
        />
        <div className="checklist simple">
          {items.map((label) => (
            <div key={label} className="check-row static">
              <CheckIcon />
              <div>
                <strong>{label}</strong>
                <span>Verificado</span>
              </div>
            </div>
          ))}
        </div>
        <label className="field">
          <span className="field-label">Observación al equipo investigador</span>
          <textarea
            className="input textarea"
            rows={5}
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Escriba una observación únicamente si requiere corrección..."
          />
        </label>
        <div className="action-row">
          <button
            type="button"
            className="btn btn-secondary btn-observation"
            disabled={!obs.trim()}
            onClick={() => onAction("vie-observation", { texto: obs })}
          >
            Enviar observación al equipo investigador
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAction("send-cie")}
          >
            Enviar al CIE
          </button>
        </div>
      </article>
    </div>
  );
}

export function DireccionInvestigacionPanel({
  proposal,
  onAction,
}: {
  proposal: DemoProposal;
  onAction: ActionHandler;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [issueDate, setIssueDate] = useState("");
  const rejected = proposal.estado.includes("Rechazada");
  const approved = proposal.estado.includes("Aprobada");
  const result = rejected
    ? "Rechazo"
    : approved
      ? "Aprobación"
      : "Pendiente de resolución";
  const resolutionNumber = proposal.resolucion || "CIE-RES-084-2026";
  const openPreview = () => {
    setIssueDate(
      new Intl.DateTimeFormat("es-CR", { dateStyle: "long" }).format(
        new Date(),
      ),
    );
    setPreviewOpen(true);
  };

  return (
    <div className="split-review">
      <CaseFile proposal={proposal} />
      <article className="card review-panel">
        <PanelIntro
          title="Notificación formal de resolución"
          description="Comunique el resultado emitido por el CIE y cierre el flujo institucional."
        />
        <div className="official-doc">
          <IconFile size={24} />
          <div>
            <span>Resolución CIE</span>
            <strong>{proposal.resolucion || "CIE-RES-084-2026"}</strong>
            <small>Resultado: {result}</small>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <span>Persona investigadora</span>
            <strong>{proposal.investigadora}</strong>
          </div>
          <div>
            <span>Fecha de emisión</span>
            <strong>{issueDate || "Pendiente"}</strong>
          </div>
          <div>
            <span>Correo</span>
            <strong>mrodriguez@tec.ac.cr</strong>
          </div>
          <div>
            <span>Estado de notificación</span>
            <strong>{proposal.notificada ? "Notificada" : "Pendiente"}</strong>
          </div>
        </div>
        <div className="action-stack">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openPreview}
          >
            Vista previa / imprimir CIE-453
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={proposal.notificada}
            onClick={() => onAction("notify-resolution")}
          >
            {proposal.notificada
              ? "Resolución notificada"
              : "Notificar resolución"}
          </button>
        </div>
        <SimpleModal
          open={previewOpen}
          title="Vista previa de resolución CIE-453"
          description={`${proposal.id} · ${resolutionNumber}`}
          onClose={() => setPreviewOpen(false)}
          bodyClassName="cie-print-body"
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPreviewOpen(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                Imprimir / guardar PDF
              </button>
            </>
          }
        >
          <article className="cie-document">
            <header className="cie-document-header">
              <p>Instituto Tecnológico de Costa Rica</p>
              <strong>Consejo de Investigación y Extensión</strong>
              <span>Resolución CIE-453</span>
            </header>
            <div className="cie-document-number">
              <span>Número de resolución</span>
              <strong>{resolutionNumber}</strong>
            </div>
            <p className="cie-document-date">Cartago, {issueDate}</p>
            <h3>Resolución sobre propuesta de investigación</h3>
            <dl className="cie-document-details">
              <div><dt>Propuesta</dt><dd>{proposal.id} · {proposal.titulo}</dd></div>
              <div><dt>Persona investigadora</dt><dd>{proposal.investigadora}</dd></div>
              <div><dt>Convocatoria</dt><dd>{proposal.convocatoria}</dd></div>
              <div><dt>Unidad académica</dt><dd>{proposal.escuela}</dd></div>
              <div><dt>Modalidad</dt><dd>{proposal.modalidad}</dd></div>
              <div><dt>Presupuesto solicitado</dt><dd>{proposal.presupuesto}</dd></div>
            </dl>
            <section className="cie-document-outcome">
              <span>Resultado</span>
              <strong>{result}</strong>
              <p>
                {approved
                  ? `Se resuelve aprobar la propuesta ${proposal.id}.`
                  : rejected
                    ? `Se resuelve rechazar la propuesta ${proposal.id}.`
                    : `La propuesta ${proposal.id} aún no tiene una resolución definitiva registrada.`}
              </p>
            </section>
            {proposal.justificacionResolucion && (
              <section className="cie-document-reason">
                <strong>Fundamento de la resolución</strong>
                <p>{proposal.justificacionResolucion}</p>
              </section>
            )}
            <footer className="cie-document-signature">
              <span>Consejo de Investigación y Extensión (CIE)</span>
            </footer>
          </article>
        </SimpleModal>
      </article>
    </div>
  );
}

export function AdminEvalTransversal({
  proposal,
}: {
  proposal: DemoProposal;
}) {
  return (
    <article className="card stack-md">
      <PanelIntro
        title="Vista transversal"
        description="El Super Administrador no simula únicamente al investigador: use «Vista actual» en la barra superior para ingresar a cualquiera de las herramientas operativas."
      />
      <ProcessTimeline
        currentStep={proposal.etapa}
        piRequired={proposal.piRequired}
      />
      <div className="admin-stage-grid">
        {[
          "Vinculación",
          "Asistente Comité",
          "Evaluador Comité",
          "Asistente Consejo",
          "Consejo",
          "Dirección Escuela",
          "Gestora VIE",
          "CIE",
          "Dirección Investigación",
        ].map((role) => (
          <div key={role}>
            <strong>{role}</strong>
            <span>Disponible mediante cambio de vista</span>
          </div>
        ))}
      </div>
    </article>
  );
}
