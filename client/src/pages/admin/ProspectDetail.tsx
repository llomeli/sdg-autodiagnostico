import { useEffect, useState } from "react";
import { CalendarClock, Mail, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { domains } from "@/lib/assessment";
import {
  activityLabels,
  fmtDate,
  fmtDateTime,
  fmtScore,
  fromLocalInput,
  isOverdue,
  STATUS_KEYS,
  statusLabels,
  toLocalInput,
  type StatusKey,
} from "./format";

type Props = {
  id: number | null;
  assignees: string[];
  onChanged: () => void;
  onDeleted: () => void;
};
type ContactType = "note" | "call" | "email" | "meeting";

export function ProspectDetail({ id, assignees, onChanged, onDeleted }: Props) {
  const utils = trpc.useUtils();
  const details = trpc.admin.getSubmission.useQuery(
    { id: id ?? 0 },
    { enabled: Boolean(id) }
  );
  const selected = details.data;

  const [assignedTo, setAssignedTo] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [activityType, setActivityType] = useState<ContactType>("note");
  const [activityBody, setActivityBody] = useState("");

  useEffect(() => {
    setAssignedTo(selected?.assignedTo ?? "");
    setNextAction(selected?.nextAction ?? "");
    setNextActionAt(toLocalInput(selected?.nextActionAt));
  }, [
    selected?.id,
    selected?.assignedTo,
    selected?.nextAction,
    selected?.nextActionAt,
  ]);

  const refresh = () => {
    if (id) utils.admin.getSubmission.invalidate({ id });
    onChanged();
  };
  const updateStatus = trpc.admin.updateStatus.useMutation({
    onSuccess: refresh,
    onError: () => toast.error("No se pudo cambiar el estatus."),
  });
  const updateFollowUp = trpc.admin.updateFollowUp.useMutation({
    onSuccess: () => {
      toast.success("Seguimiento guardado.");
      refresh();
    },
    onError: () => toast.error("No se pudo guardar el seguimiento."),
  });
  const addActivity = trpc.admin.addActivity.useMutation({
    onSuccess: () => {
      setActivityBody("");
      refresh();
    },
    onError: () => toast.error("No se pudo registrar la actividad."),
  });
  const deleteSubmission = trpc.admin.deleteSubmission.useMutation({
    onSuccess: () => {
      toast.success("Registro eliminado.");
      onDeleted();
      onChanged();
    },
  });

  if (!id) {
    return (
      <section className="lead-detail">
        <div className="empty-detail">
          <Mail size={29} />
          <h2>Selecciona un registro</h2>
          <p>
            Consulta el perfil, da seguimiento y revisa las respuestas por
            dominio.
          </p>
        </div>
      </section>
    );
  }
  if (details.isLoading || !selected) {
    return (
      <section className="lead-detail">
        <div className="empty-detail">
          <RefreshCw className="spin" size={28} />
          <p>
            {details.error
              ? "No fue posible cargar el registro."
              : "Cargando diagnóstico…"}
          </p>
        </div>
      </section>
    );
  }

  const followUpDirty =
    (assignedTo.trim() || null) !== (selected.assignedTo || null) ||
    (nextAction.trim() || null) !== (selected.nextAction || null) ||
    nextActionAt !== toLocalInput(selected.nextActionAt);
  const saveFollowUp = () =>
    updateFollowUp.mutate({
      id: selected.id,
      assignedTo: assignedTo.trim() || null,
      nextAction: nextAction.trim() || null,
      nextActionAt: fromLocalInput(nextActionAt),
    });
  const confirmDelete = () => {
    if (
      window.confirm(
        `Eliminar definitivamente el registro de ${selected.fullName}, sus respuestas y su historial. Úsalo sólo para solicitudes de cancelación/eliminación. ¿Continuar?`
      )
    ) {
      deleteSubmission.mutate({ id: selected.id, confirm: "ELIMINAR" });
    }
  };
  const overdue = isOverdue(selected.nextActionAt, selected.status);

  return (
    <section className="lead-detail">
      <div className="detail-content">
        <div className="detail-top">
          <div>
            <p className="eyebrow">{selected.companyName}</p>
            <h2>{selected.fullName}</h2>
            <p>
              {selected.jobTitle}
              {selected.area ? ` · ${selected.area}` : ""} · registrado{" "}
              {fmtDate(selected.createdAt)}
            </p>
          </div>
          <div className="detail-actions">
            <select
              value={selected.status}
              aria-label="Estatus"
              onChange={e =>
                updateStatus.mutate({
                  id: selected.id,
                  status: e.target.value as StatusKey,
                })
              }
            >
              {STATUS_KEYS.map(value => (
                <option value={value} key={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
            <button
              className="icon-button danger"
              type="button"
              title="Eliminar registro"
              aria-label="Eliminar registro"
              disabled={deleteSubmission.isPending}
              onClick={confirmDelete}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="detail-info">
          <div>
            <span>Sector</span>
            <b>{selected.sector}</b>
          </div>
          <div>
            <span>Empleados</span>
            <b>{selected.employeeRange}</b>
          </div>
          <div>
            <span>Ubicación</span>
            <b>{[selected.city, selected.state].filter(Boolean).join(", ")}</b>
          </div>
          <div>
            <span>Correo</span>
            <b>
              <a href={`mailto:${selected.workEmail}`}>{selected.workEmail}</a>
            </b>
          </div>
          <div>
            <span>Teléfono</span>
            <b>{selected.phone || "No compartido"}</b>
          </div>
          <div>
            <span>Canal preferido</span>
            <b>{selected.preferredChannel || "—"}</b>
          </div>
          <div>
            <span>Impacto</span>
            <b>{selected.businessImpact}</b>
          </div>
          <div>
            <span>Urgencia</span>
            <b>{selected.urgency}</b>
          </div>
          <div>
            <span>Promedio general</span>
            <b>{fmtScore(selected.overallScore)} / 5</b>
          </div>
        </div>

        <div className="detail-section followup-card">
          <h3>
            <CalendarClock size={16} /> Seguimiento comercial
          </h3>
          <div className="followup-grid">
            <label>
              Responsable
              <input
                list="assignee-options"
                value={assignedTo}
                maxLength={120}
                placeholder="Nombre o correo"
                onChange={e => setAssignedTo(e.target.value)}
              />
              <datalist id="assignee-options">
                {assignees.map(item => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
            <label>
              Siguiente paso
              <input
                value={nextAction}
                maxLength={255}
                placeholder="Ej. Llamada de diagnóstico"
                onChange={e => setNextAction(e.target.value)}
              />
            </label>
            <label>
              Fecha y hora
              <input
                type="datetime-local"
                value={nextActionAt}
                onChange={e => setNextActionAt(e.target.value)}
                className={
                  overdue && !followUpDirty ? "field-invalid" : undefined
                }
              />
            </label>
          </div>
          <div className="followup-footer">
            <span className={overdue ? "overdue" : "muted"}>
              {overdue
                ? "El siguiente paso está vencido."
                : `Último contacto: ${fmtDateTime(selected.lastContactAt)}`}
            </span>
            <button
              type="button"
              className="button button-aqua small"
              disabled={!followUpDirty || updateFollowUp.isPending}
              onClick={saveFollowUp}
            >
              {updateFollowUp.isPending ? "Guardando…" : "Guardar seguimiento"}
            </button>
          </div>
        </div>

        <div className="detail-section">
          <h3>Actividad</h3>
          <form
            className="activity-form"
            onSubmit={event => {
              event.preventDefault();
              if (activityBody.trim())
                addActivity.mutate({
                  id: selected.id,
                  type: activityType,
                  body: activityBody.trim(),
                });
            }}
          >
            <select
              value={activityType}
              aria-label="Tipo de actividad"
              onChange={e => setActivityType(e.target.value as ContactType)}
            >
              <option value="note">Nota</option>
              <option value="call">Llamada</option>
              <option value="email">Correo</option>
              <option value="meeting">Reunión</option>
            </select>
            <textarea
              rows={2}
              maxLength={4000}
              value={activityBody}
              placeholder="Qué pasó, acuerdos, próximos pasos…"
              onChange={e => setActivityBody(e.target.value)}
              aria-label="Detalle de la actividad"
            />
            <button
              type="submit"
              className="button button-outline small"
              disabled={!activityBody.trim() || addActivity.isPending}
            >
              Registrar
            </button>
          </form>
          <p className="hint">
            Llamadas, correos y reuniones actualizan el “último contacto”. No
            registres datos sensibles innecesarios.
          </p>
          {selected.activities.length ? (
            <ol className="timeline">
              {selected.activities.map(activity => (
                <li key={activity.id} className={`t-${activity.type}`}>
                  <div>
                    <b>{activityLabels[activity.type]}</b>
                    <span>
                      {fmtDateTime(activity.createdAt)} · {activity.author}
                    </span>
                  </div>
                  <p>
                    {activity.type === "status"
                      ? formatStatusChange(activity.body)
                      : activity.body}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Sin actividad registrada.</p>
          )}
        </div>

        <div className="detail-section">
          <h3>Principal preocupación</h3>
          <p>{selected.primaryConcern}</p>
          {(selected.upcomingProject || selected.expectedOutcome) && (
            <p className="muted-block">
              {selected.upcomingProject && (
                <>Proyecto próximo: {selected.upcomingProject}. </>
              )}
              {selected.expectedOutcome && (
                <>Resultado esperado: {selected.expectedOutcome}.</>
              )}
            </p>
          )}
        </div>

        <div className="detail-section">
          <h3>Lectura de madurez</h3>
          <div className="domain-results">
            {domains.map(domain => {
              const rows = selected.responses.filter(
                answer => answer.domain === domain.id
              );
              const values = rows
                .filter(answer => answer.score !== null)
                .map(answer => answer.score as number);
              const score = values.length
                ? values.reduce((a, b) => a + b, 0) / values.length
                : null;
              return (
                <div
                  key={domain.id}
                  title={`${domain.title}: ${score === null ? "N/A" : score.toFixed(1)} de 5`}
                >
                  <span>{domain.title}</span>
                  <b>{score === null ? "N/A" : score.toFixed(1)}</b>
                  <i>
                    <em style={{ width: `${((score ?? 0) / 5) * 100}%` }} />
                  </i>
                </div>
              );
            })}
          </div>
        </div>

        <div className="detail-section">
          <h3>Respuestas con prioridad alta</h3>
          {selected.responses.filter(answer => answer.priority === "Alta")
            .length ? (
            <div className="priority-list">
              {selected.responses
                .filter(answer => answer.priority === "Alta")
                .map(answer => (
                  <div key={answer.id}>
                    <b>{answer.questionId}</b>
                    <span>
                      {answer.responsibleRole || "Sin responsable"} ·{" "}
                      {answer.processSystem || "Sin proceso"}
                    </span>
                    <p>{answer.comments || "Sin comentario"}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="muted">No se registraron prioridades altas.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function formatStatusChange(body: string) {
  const [from, to] = body.split(" → ");
  const label = (key: string) => statusLabels[key as StatusKey] ?? key;
  return to ? `${label(from)} → ${label(to)}` : body;
}
