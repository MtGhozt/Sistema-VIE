import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { fetchConvocatorias, type Convocatoria } from "../api/convocatorias";
import {
  createPropuesta,
  enviarPropuesta,
  fetchPropuesta,
  patchPropuesta,
  type PreguntaGeneral,
  type PropuestaDetalle,
} from "../api/propuestas";
import { useAuth } from "../auth/AuthContext";
import { FormWizardStepContent } from "../components/FormWizardStepContent";
import { useToast } from "../components/toast/ToastContext";
import {
  DEFAULT_FORM_WIZARD_STATE,
  ESTADO_ARTE_MAX_WORDS,
  FORM_WIZARD_STEPS,
  getFormStepStatus,
  PLAN_RESPONSIBILITIES,
  TEAM_HOUR_TYPES,
  TEAM_MEMBER_ROLES,
  type FormWizardState,
  type NivelTrl,
  TRL_LEVELS,
  type YesNo,
} from "../data/formWizard";

function yesNoToApi(value: Exclude<YesNo, "">) {
  return value === "Sí" ? "si" : "no";
}

function yesNoFromApi(
  pregunta: PreguntaGeneral | undefined,
  fallback: YesNo,
): YesNo {
  if (!pregunta) return fallback;
  if (pregunta.respuesta === "si") return "Sí";
  if (pregunta.respuesta === "no") return "No";
  throw new Error(`Respuesta inválida para ${pregunta.codigo}`);
}

function gradeFromApi(
  pregunta: PreguntaGeneral | undefined,
  fallback: FormWizardState["q6"],
): FormWizardState["q6"] {
  if (!pregunta) return fallback;
  if (pregunta.respuesta === "no") return "No";
  if (pregunta.respuesta === "parcial") return "Sí, parcial";
  if (pregunta.respuesta === "total") return "Sí, totalmente";
  throw new Error(`Respuesta inválida para ${pregunta.codigo}`);
}

function isNivelTrl(value: string): value is NivelTrl {
  return TRL_LEVELS.some((nivel) => nivel.value === value);
}

function serializeDetails(details: Record<string, string>) {
  const nonEmpty = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value.trim()),
  );
  return Object.keys(nonEmpty).length > 0 ? JSON.stringify(nonEmpty) : null;
}

function parseDetails(pregunta: PreguntaGeneral | undefined) {
  if (!pregunta?.detalle) return {};
  const value: unknown = JSON.parse(pregunta.detalle);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Detalle inválido para ${pregunta.codigo}`);
  }
  const details: Record<string, string> = {};
  for (const [key, detail] of Object.entries(value)) {
    if (typeof detail !== "string") {
      throw new Error(`Detalle inválido para ${pregunta.codigo}`);
    }
    details[key] = detail;
  }
  return details;
}

function questionDetails(
  numero: number,
  codigo: string,
  respuesta: string,
  detalles: Record<string, string> = {},
): PreguntaGeneral {
  return {
    numero,
    codigo,
    respuesta,
    detalle: serializeDetails(detalles),
  };
}

export function PropuestaNuevaPage() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editIdRaw = searchParams.get("edit");
  const editId = editIdRaw ? Number(editIdRaw) : NaN;
  const isEditing = Number.isFinite(editId);

  const canCreate =
    session?.role === "investigador" || session?.role === "admin";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormWizardState>(DEFAULT_FORM_WIZARD_STATE);
  const [saveStatus, setSaveStatus] = useState(
    "Guardado automáticamente hace 30 segundos",
  );
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [idConvocatoria, setIdConvocatoria] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  const progressPct = Math.round(((step + 1) / FORM_WIZARD_STEPS.length) * 100);

  useEffect(() => {
    void (async () => {
      try {
        const rows = await fetchConvocatorias();
        const activas = rows.filter((c) => c.estado === "activa");
        setConvocatorias(activas.length > 0 ? activas : rows);
        if (!isEditing) {
          if (activas[0]) setIdConvocatoria(activas[0].id);
          else if (rows[0]) setIdConvocatoria(rows[0].id);
        }
      } catch (err) {
        showToast(
          err instanceof ApiError
            ? err.message
            : "No se pudieron cargar convocatorias",
          "error",
        );
      }
    })();
  }, [showToast, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    void (async () => {
      setLoadingEdit(true);
      try {
        const d = await fetchPropuesta(editId);
        if (d.estadoActual !== "borrador") {
          showToast(
            "Solo se pueden editar propuestas en borrador",
            "error",
          );
          navigate(`/propuestas/${d.id}`, { replace: true });
          return;
        }
        const preguntas = new Map(
          d.preguntasGenerales.map((pregunta) => [pregunta.codigo, pregunta]),
        );
        const detalle1 = parseDetails(preguntas.get("q1"));
        const detalle2 = parseDetails(preguntas.get("q2"));
        const detalle3 = parseDetails(preguntas.get("q3"));
        const detalle4 = parseDetails(preguntas.get("q4"));
        const detalle5 = parseDetails(preguntas.get("q5"));
        const detalle6 = parseDetails(preguntas.get("q6"));
        const detalle7 = parseDetails(preguntas.get("q7"));
        const detalle8 = parseDetails(preguntas.get("q8"));
        const detalle9 = parseDetails(preguntas.get("q9"));
        const trl = preguntas.get("trl_esperado")?.respuesta;
        const teamTec: FormWizardState["teamTec"] =
          d.participantes.flatMap((participant, index) =>
            participant.tipo === "funcionario_tec"
              ? [
                  {
                    id: `tec-${d.id}-${index}`,
                    participantId: participant.id,
                    nombre: participant.nombre,
                    iniciales: participant.iniciales,
                    orcid: participant.orcid,
                    instancia: participant.instancia,
                    rol:
                      TEAM_MEMBER_ROLES.find(
                        (role) => role === participant.rol,
                      ) ?? "",
                    horas:
                      participant.horas.length > 0
                        ? participant.horas.map((hours) => ({
                            tipo:
                              TEAM_HOUR_TYPES.find(
                                (type) => type === hours.tipo,
                              ) ?? "",
                            cantidad: String(hours.cantidad),
                          }))
                        : [{ tipo: "", cantidad: "" }],
                    periodo: participant.periodo,
                  },
                ]
              : [],
          );
        const teamExternal: FormWizardState["teamExternal"] =
          d.participantes.flatMap((participant, index) =>
            participant.tipo === "colaborador_externo"
              ? [
                  {
                    id: `externo-${d.id}-${index}`,
                    participantId: participant.id,
                    nombre: participant.nombre,
                    iniciales: participant.iniciales,
                    orcid: participant.orcid,
                    institucion: participant.institucion,
                  },
                ]
              : [],
          );
        setIdConvocatoria(d.idConvocatoria);
        setForm((prev) => ({
          ...prev,
          titulo: d.titulo,
          modalidad: d.modalidadLabel || prev.modalidad,
          resumen: d.resumen ?? "",
          abstract: d.abstractEn ?? "",
          palabras: d.keywordsEs.join(", "),
          keywords: d.keywordsEn.join(", "),
          problema: d.problema ?? prev.problema,
          objetivoGeneral: d.objetivoGeneral ?? prev.objetivoGeneral,
          estadoArte: d.estadoArte ?? prev.estadoArte,
          objetivosEspecificos: Array.from({ length: 3 }, (_, index) => {
            const objective = d.objetivosEspecificos[index];
            return objective
              ? {
                  id: `objetivo-${d.id}-${objective.id}`,
                  objectiveId: objective.id,
                  descripcion: objective.descripcion,
                }
              : {
                  id: `objetivo-${d.id}-${index + 1}`,
                  descripcion: "",
                };
          }),
          metodologia: d.metodologia ?? prev.metodologia,
          q1: yesNoFromApi(preguntas.get("q1"), prev.q1),
          q1Entidad: detalle1.entidad ?? prev.q1Entidad,
          q1Estado: detalle1.estado ?? prev.q1Estado,
          q1Contrapartida:
            detalle1.contrapartida === "Sí" ||
            detalle1.contrapartida === "No"
              ? detalle1.contrapartida
              : prev.q1Contrapartida,
          q2: yesNoFromApi(preguntas.get("q2"), prev.q2),
          q2Proyecto: detalle2.proyecto ?? prev.q2Proyecto,
          q2Relacion: detalle2.relacion ?? prev.q2Relacion,
          q3: yesNoFromApi(preguntas.get("q3"), prev.q3),
          q3Detalle: detalle3.detalle ?? prev.q3Detalle,
          q4: yesNoFromApi(preguntas.get("q4"), prev.q4),
          q4Ambito:
            detalle4.ambito === "nacional" ||
            detalle4.ambito === "internacional"
              ? detalle4.ambito
              : prev.q4Ambito,
          q5: yesNoFromApi(preguntas.get("q5"), prev.q5),
          q5Convenio: detalle5.convenio ?? prev.q5Convenio,
          q6: gradeFromApi(preguntas.get("q6"), prev.q6),
          q6Persona: detalle6.persona ?? prev.q6Persona,
          q6Programa: detalle6.programa ?? prev.q6Programa,
          q6Universidad: detalle6.universidad ?? prev.q6Universidad,
          q7: yesNoFromApi(preguntas.get("q7"), prev.q7),
          q7Detalle: detalle7.detalle ?? prev.q7Detalle,
          q8: yesNoFromApi(preguntas.get("q8"), prev.q8),
          q8Oficio: detalle8.oficio ?? prev.q8Oficio,
          q9: yesNoFromApi(preguntas.get("q9"), prev.q9),
          q9Tipo:
            detalle9.tipo === "Proceso" || detalle9.tipo === "Producto"
              ? detalle9.tipo
              : prev.q9Tipo,
          trlEsperado:
            trl && isNivelTrl(trl)
              ? trl
              : prev.trlEsperado,
          teamTec,
          teamExternal,
          planAccion: d.planAccion.map((activity) => ({
            id: `actividad-${d.id}-${activity.id}`,
            activityId: activity.id,
            objetivoNumero:
              activity.objetivoNumero === 1
                ? "1"
                : activity.objetivoNumero === 2
                  ? "2"
                  : activity.objetivoNumero === 3
                    ? "3"
                    : "",
            actividad: activity.actividad,
            resultadoEsperado: activity.resultadoEsperado,
            participantes: activity.participantes.map(
              (assignment, assignmentIndex) => {
                const teamMember = [...teamTec, ...teamExternal].find(
                  (member) =>
                    (assignment.idParticipante !== null &&
                      member.participantId === assignment.idParticipante) ||
                    member.iniciales === assignment.iniciales,
                );
                return {
                  id: `asignacion-${d.id}-${activity.id}-${assignmentIndex}`,
                  teamMemberId: teamMember?.id ?? "",
                  responsabilidad:
                    PLAN_RESPONSIBILITIES.find(
                      (responsibility) =>
                        responsibility === assignment.responsabilidad,
                    ) ?? "",
                };
              },
            ),
            riesgos: activity.riesgos.map((risk, riskIndex) => ({
              id: `riesgo-${d.id}-${activity.id}-${riskIndex}`,
              riesgo: risk.riesgo,
              mitigacion: risk.mitigacion,
              responsable: risk.responsable,
            })),
            mesInicio: String(activity.mesInicio),
            duracionMeses: String(activity.duracionMeses),
          })),
        }));
        setSaveStatus("Borrador cargado");
      } catch (err) {
        showToast(
          err instanceof ApiError ? err.message : "No se pudo cargar el borrador",
          "error",
        );
        navigate("/propuestas", { replace: true });
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [isEditing, editId, navigate, showToast]);

  function patch(partial: Partial<FormWizardState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setSaveStatus("Guardado automáticamente hace unos segundos");
  }

  function draftPayload() {
    const estadoArteWordCount = form.estadoArte
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (estadoArteWordCount > ESTADO_ARTE_MAX_WORDS) {
      throw new Error(
        `El estado del arte supera el máximo de ${ESTADO_ARTE_MAX_WORDS} palabras (aproximadamente dos páginas).`,
      );
    }

    const teamMembers = [...form.teamTec, ...form.teamExternal];
    const planAccion = form.planAccion.flatMap((activity) => {
      const risks = activity.riesgos.filter(
        (risk) =>
          risk.riesgo.trim() ||
          risk.mitigacion.trim() ||
          risk.responsable.trim(),
      );
      const hasAnyValue = Boolean(
        activity.objetivoNumero ||
          activity.actividad.trim() ||
          activity.resultadoEsperado.trim() ||
          activity.mesInicio ||
          activity.duracionMeses ||
          activity.participantes.length > 0 ||
          risks.length > 0,
      );
      if (!hasAnyValue) return [];

      const mesInicio = Number(activity.mesInicio);
      const duracionMeses = Number(activity.duracionMeses);
      const assignments = activity.participantes.map((assignment) => {
        const member = teamMembers.find(
          (candidate) => candidate.id === assignment.teamMemberId,
        );
        if (
          !member ||
          !member.iniciales.trim() ||
          !assignment.responsabilidad
        ) {
          throw new Error(
            "Cada actividad debe tener participantes seleccionados con iniciales y responsabilidad.",
          );
        }
        return {
          iniciales: member.iniciales.trim().toUpperCase(),
          responsabilidad: assignment.responsabilidad,
        };
      });
      if (
        !activity.objetivoNumero ||
        !activity.actividad.trim() ||
        !activity.resultadoEsperado.trim() ||
        !Number.isInteger(mesInicio) ||
        !Number.isInteger(duracionMeses) ||
        mesInicio < 1 ||
        duracionMeses < 1 ||
        mesInicio + duracionMeses - 1 > 36 ||
        assignments.length === 0 ||
        risks.length === 0 ||
        risks.length !== activity.riesgos.length ||
        risks.some(
          (risk) =>
            !risk.riesgo.trim() ||
            !risk.mitigacion.trim() ||
            !risk.responsable.trim(),
        )
      ) {
        throw new Error(
          "Completá cada actividad con objetivo, resultado, participantes, periodo y al menos un riesgo con mitigación y responsable.",
        );
      }

      const initials = assignments.map((assignment) => assignment.iniciales);
      if (new Set(initials).size !== initials.length) {
        throw new Error(
          "No repitas a la misma persona en una actividad. Cada participante debe tener iniciales distintas.",
        );
      }

      return [
        {
          objetivoNumero: Number(activity.objetivoNumero),
          actividad: activity.actividad.trim(),
          resultadoEsperado: activity.resultadoEsperado.trim(),
          participantes: assignments,
          riesgos: risks.map((risk) => ({
            riesgo: risk.riesgo.trim(),
            mitigacion: risk.mitigacion.trim(),
            responsable: risk.responsable.trim(),
          })),
          mesInicio,
          duracionMeses,
        },
      ];
    });

    const participantes = [
      ...form.teamTec.map((member) => ({
        ...(member.participantId === undefined
          ? {}
          : { id: member.participantId }),
        tipo: "funcionario_tec" as const,
        nombre: member.nombre.trim(),
        iniciales: member.iniciales.trim().toUpperCase(),
        orcid: member.orcid.trim(),
        instancia: member.instancia.trim(),
        rol: member.rol,
        periodo: member.periodo.trim(),
        horas: member.horas.flatMap((hours) => {
          if (!hours.tipo && !hours.cantidad.trim()) return [];
          const cantidad = Number(hours.cantidad);
          if (
            !hours.tipo ||
            !hours.cantidad.trim() ||
            !Number.isFinite(cantidad) ||
            cantidad <= 0 ||
            cantidad > 999.99
          ) {
            throw new Error(
              `Completá el tipo y una cantidad válida de horas para ${member.nombre || "cada persona del equipo"}`,
            );
          }
          return [{ tipo: hours.tipo, cantidad }];
        }),
      })),
      ...form.teamExternal.map((member) => ({
        ...(member.participantId === undefined
          ? {}
          : { id: member.participantId }),
        tipo: "colaborador_externo" as const,
        nombre: member.nombre.trim(),
        iniciales: member.iniciales.trim().toUpperCase(),
        orcid: member.orcid.trim(),
        institucion: member.institucion.trim(),
      })),
    ];
    return {
      titulo: form.titulo.trim(),
      modalidad: form.modalidad,
      resumen: form.resumen.trim() || undefined,
      abstractEn: form.abstract.trim() || undefined,
      problema: form.problema.trim() || undefined,
      objetivoGeneral: form.objetivoGeneral.trim() || undefined,
      estadoArte: form.estadoArte.trim(),
      objetivosEspecificos: form.objetivosEspecificos
        .slice(0, 3)
        .map((objective) => ({
          ...(objective.objectiveId === undefined
            ? {}
            : { id: objective.objectiveId }),
          descripcion: objective.descripcion.trim(),
        })),
      planAccion,
      metodologia: form.metodologia.trim() || undefined,
      keywordsEs: form.palabras,
      keywordsEn: form.keywords,
      participantes,
      preguntasGenerales: [
        form.q1
          ? questionDetails(1, "q1", yesNoToApi(form.q1), {
              entidad: form.q1Entidad,
              estado: form.q1Estado,
              contrapartida: form.q1Contrapartida,
            })
          : null,
        form.q2
          ? questionDetails(2, "q2", yesNoToApi(form.q2), {
              proyecto: form.q2Proyecto,
              relacion: form.q2Relacion,
            })
          : null,
        form.q3
          ? questionDetails(3, "q3", yesNoToApi(form.q3), {
              detalle: form.q3Detalle,
            })
          : null,
        form.q4
          ? questionDetails(4, "q4", yesNoToApi(form.q4), {
              ambito: form.q4Ambito,
            })
          : null,
        form.q5
          ? questionDetails(5, "q5", yesNoToApi(form.q5), {
              convenio: form.q5Convenio,
            })
          : null,
        form.q6
          ? questionDetails(
              6,
              "q6",
              form.q6 === "Sí, parcial"
                ? "parcial"
                : form.q6 === "Sí, totalmente"
                  ? "total"
                  : "no",
              {
                persona: form.q6Persona,
                programa: form.q6Programa,
                universidad: form.q6Universidad,
              },
            )
          : null,
        form.q7
          ? questionDetails(7, "q7", yesNoToApi(form.q7), {
              detalle: form.q7Detalle,
            })
          : null,
        form.q8
          ? questionDetails(8, "q8", yesNoToApi(form.q8), {
              oficio: form.q8Oficio,
            })
          : null,
        form.q9
          ? questionDetails(9, "q9", yesNoToApi(form.q9), {
              tipo: form.q9Tipo,
            })
          : null,
        form.modalidad === "Desarrollo tecnológico" && form.trlEsperado
          ? {
              numero: 10,
              codigo: "trl_esperado",
              respuesta: form.trlEsperado,
              detalle: null,
            }
          : null,
      ].filter((question): question is PreguntaGeneral => question !== null),
    };
  }

  async function persistDraft(): Promise<PropuestaDetalle> {
    if (isEditing) {
      return patchPropuesta(editId, draftPayload());
    }
    return createPropuesta({
      ...draftPayload(),
      idConvocatoria: Number(idConvocatoria),
    });
  }

  async function onSave() {
    if (!canCreate) {
      showToast("Ingresá como investigador para crear propuestas", "error");
      return;
    }
    if (!form.titulo.trim() || idConvocatoria === "") {
      showToast("Completá título y convocatoria", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await persistDraft();
      showToast("Borrador guardado", "success");
      navigate(`/propuestas/${saved.id}`, { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo guardar",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  /** Guarda el borrador y lo envía a revisión (CU2 → bandeja CU3). */
  async function onEnviar() {
    if (!canCreate) {
      showToast("Ingresá como investigador para enviar propuestas", "error");
      return;
    }
    if (!form.titulo.trim() || idConvocatoria === "") {
      showToast("Completá título y convocatoria antes de enviar", "error");
      return;
    }
    if (!form.declaracion) {
      showToast("Debés aceptar la declaración jurada antes de enviar", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await persistDraft();
      const sent = await enviarPropuesta(saved.id);
      showToast(
        `Propuesta ${sent.codigo} enviada a revisión`,
        "success",
      );
      navigate(`/propuestas/${sent.id}`, { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "No se pudo enviar la propuesta",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <section className="card">
        <h1>Nueva propuesta</h1>
        <p>Esta acción requiere el rol Investigador (o admin).</p>
        <Link to="/propuestas" className="btn btn-secondary">
          Volver
        </Link>
      </section>
    );
  }

  if (loadingEdit) {
    return (
      <section className="card">
        <p>Cargando borrador…</p>
      </section>
    );
  }

  return (
    <>
      <div className="breadcrumbs">
        <Link to="/propuestas">Propuestas</Link>
        <span>/</span>
        <span>{isEditing ? "Editar borrador" : "Nueva"}</span>
      </div>

      <div className="wizard-layout wizard-layout-wide">
        <aside className="wizard-sidebar">
          <div className="wizard-progress-head">
            <span>Progreso</span>
            <strong>{progressPct}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Avance del formulario"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div style={{ width: `${progressPct}%` }} />
          </div>
          <nav className="wizard-steps" aria-label="Pasos del formulario">
            {FORM_WIZARD_STEPS.map((label, i) => {
              const status = getFormStepStatus(
                i,
                form,
                idConvocatoria !== "",
              );
              return (
                <button
                  key={label}
                  type="button"
                  aria-current={i === step ? "step" : undefined}
                  className={
                    i === step
                      ? "active"
                      : status === "Completa"
                        ? "done"
                        : undefined
                  }
                  onClick={() => setStep(i)}
                >
                  <span>{i + 1}</span>
                  <div>
                    <strong>
                      {i + 1}. {label}
                    </strong>
                    <small>{status}</small>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="card wizard-card">
          <div className="wizard-card-head institutional-form-head">
            <div>
              <span className="eyebrow">
                Formulario VIE 2027 · Paso {step + 1} de{" "}
                {FORM_WIZARD_STEPS.length}
              </span>
              <h1 className="sr-only">
                {isEditing ? "Editar borrador de propuesta" : "Nueva propuesta de investigación"}
              </h1>
              <h2>{FORM_WIZARD_STEPS[step]}</h2>
            </div>
            <div className="form-code">
              <strong>F-VIE-2027</strong>
              <span role="status" aria-live="polite">
                {saveStatus}
              </span>
            </div>
          </div>

          <div className="wizard-body">
            <FormWizardStepContent
              step={step}
              form={form}
              patch={patch}
              convocatorias={convocatorias}
              idConvocatoria={idConvocatoria}
              setIdConvocatoria={setIdConvocatoria}
            />
          </div>

          <div className="wizard-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Anterior
            </button>
            <div className="wizard-footer-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => void onSave()}
              >
                Guardar borrador
              </button>
              {step < FORM_WIZARD_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    setStep((s) =>
                      Math.min(FORM_WIZARD_STEPS.length - 1, s + 1),
                    )
                  }
                >
                  Siguiente
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={saving}
                    onClick={() => void onSave()}
                  >
                    Guardar y salir
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={() => void onEnviar()}
                  >
                    Enviar a revisión
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
