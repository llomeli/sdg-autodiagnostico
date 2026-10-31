import { RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { domains } from "@/lib/assessment";
import { STATUS_KEYS, statusLabels } from "./format";

/**
 * Aggregates only (counts and averages). Charts are single-series, one hue
 * (#1f6fb2, ≥3:1 on white), each with a visible value or a table, so nothing
 * depends on color alone.
 */
export function DashboardView() {
  const dashboard = trpc.admin.dashboard.useQuery();
  const data = dashboard.data;

  if (dashboard.isLoading)
    return (
      <div className="empty-detail">
        <RefreshCw className="spin" size={26} />
        <p>Calculando…</p>
      </div>
    );
  if (!data)
    return <p className="admin-error">No fue posible calcular el tablero.</p>;

  const weeklyMax = Math.max(1, ...data.weekly.map(point => point.count));
  const statusMax = Math.max(
    1,
    ...STATUS_KEYS.map(key => data.byStatus[key] ?? 0)
  );
  const urgencyMax = Math.max(1, ...data.byUrgency.map(row => row.count));
  const domainScores = new Map(
    data.byDomain.map(row => [row.key, row.averageScore])
  );
  const lastWeek = data.weekly.at(-1);
  const fmtWeek = (week: string) =>
    new Date(`${week}T12:00:00Z`).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <div className="dashboard">
      <div className="kpi-row">
        <Kpi label="Prospectos" value={String(data.total)} />
        <Kpi
          label="Promedio general"
          value={
            data.averageScore === null ? "—" : data.averageScore.toFixed(1)
          }
          suffix="/ 5"
        />
        <Kpi
          label="Nuevos sin asignar"
          value={String(data.unassignedNew)}
          tone={data.unassignedNew ? "attention" : undefined}
        />
        <Kpi
          label="Siguientes pasos vencidos"
          value={String(data.overdue)}
          tone={data.overdue ? "attention" : undefined}
        />
        <Kpi
          label="Mediana al primer contacto"
          value={
            data.medianHoursToFirstContact === null
              ? "—"
              : formatHours(data.medianHoursToFirstContact)
          }
          note={
            data.contactedWithLog
              ? `${data.contactedWithLog} con contacto registrado`
              : "Registra llamadas, correos o reuniones"
          }
        />
      </div>

      <section className="dash-card wide">
        <header>
          <h3>Registros por semana</h3>
          <span>
            Últimas 12 semanas · semana actual: {lastWeek?.count ?? 0}
          </span>
        </header>
        <div
          className="columns"
          role="img"
          aria-label={`Registros por semana; semana actual ${lastWeek?.count ?? 0}`}
        >
          {data.weekly.map((point, index) => {
            // Label only the peak and the current week; the tooltip carries the rest.
            const labelled =
              point.count > 0 &&
              (point.count === weeklyMax || index === data.weekly.length - 1);
            return (
              <div
                className="column"
                key={point.week}
                title={`Semana del ${fmtWeek(point.week)}: ${point.count} registro(s)`}
              >
                <div className="column-track">
                  {point.count > 0 && (
                    <div
                      className="column-bar"
                      style={{ height: `${(point.count / weeklyMax) * 100}%` }}
                    >
                      {labelled && (
                        <b className="column-value">{point.count}</b>
                      )}
                    </div>
                  )}
                </div>
                <span>{fmtWeek(point.week)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dash-card">
        <header>
          <h3>Embudo por estatus</h3>
        </header>
        <BarList
          rows={STATUS_KEYS.map(key => ({
            label: statusLabels[key],
            value: data.byStatus[key] ?? 0,
          }))}
          max={statusMax}
        />
      </section>

      <section className="dash-card">
        <header>
          <h3>Urgencia declarada</h3>
        </header>
        <BarList
          rows={data.byUrgency.map(row => ({
            label: row.key,
            value: row.count,
          }))}
          max={urgencyMax}
        />
      </section>

      <section className="dash-card wide">
        <header>
          <h3>Madurez promedio por dominio</h3>
          <span>
            Escala 0–5 · todas las respuestas, sin N/A · autodeclarado, no es un
            benchmark
          </span>
        </header>
        <BarList
          rows={domains.map(domain => ({
            label: domain.title,
            value: domainScores.get(domain.id) ?? null,
          }))}
          max={5}
          format={value => value.toFixed(1)}
        />
      </section>

      <section className="dash-card wide">
        <header>
          <h3>Por sector</h3>
        </header>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Sector</th>
              <th>Prospectos</th>
              <th>Promedio general</th>
            </tr>
          </thead>
          <tbody>
            {data.bySector.map(row => (
              <tr key={row.key}>
                <td>{row.key}</td>
                <td>{row.count}</td>
                <td>
                  {row.averageScore === null
                    ? "—"
                    : row.averageScore.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  suffix,
  note,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  note?: string;
  tone?: "attention";
}) {
  return (
    <div className={`kpi ${tone ?? ""}`}>
      <span>{label}</span>
      <b>
        {value}
        {suffix && <small> {suffix}</small>}
      </b>
      {note && <em>{note}</em>}
    </div>
  );
}

function BarList({
  rows,
  max,
  format = value => String(value),
}: {
  rows: Array<{ label: string; value: number | null }>;
  max: number;
  format?: (value: number) => string;
}) {
  return (
    <ul className="bar-list">
      {rows.map(row => (
        <li
          key={row.label}
          title={`${row.label}: ${row.value === null ? "sin datos" : format(row.value)}`}
        >
          <span className="bar-label">{row.label}</span>
          <span className="bar-track">
            {row.value ? (
              <span
                className="bar-fill"
                style={{ width: `${Math.max(1, (row.value / max) * 100)}%` }}
              />
            ) : null}
          </span>
          <b>{row.value === null ? "—" : format(row.value)}</b>
        </li>
      ))}
    </ul>
  );
}

function formatHours(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${hours.toFixed(hours < 10 ? 1 : 0)} h`;
  return `${(hours / 24).toFixed(1)} días`;
}
