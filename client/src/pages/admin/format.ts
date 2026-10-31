export const statusLabels = {
  new: "Nuevo",
  reviewing: "En revisión",
  contacted: "Contactado",
  qualified: "Calificado",
  archived: "Archivado",
} as const;
export type StatusKey = keyof typeof statusLabels;
export const STATUS_KEYS = Object.keys(statusLabels) as StatusKey[];

export const activityLabels = {
  note: "Nota",
  call: "Llamada",
  email: "Correo",
  meeting: "Reunión",
  status: "Cambio de estatus",
  assignment: "Asignación",
} as const;

export const UNASSIGNED = "__sin_asignar__";

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});
const dateTimeFmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export const fmtDate = (value: Date | string | null | undefined) =>
  value ? dateFmt.format(new Date(value)) : "—";
export const fmtDateTime = (value: Date | string | null | undefined) =>
  value ? dateTimeFmt.format(new Date(value)) : "—";
export const fmtScore = (value: number | null | undefined, scale = 100) =>
  value === null || value === undefined ? "—" : (value / scale).toFixed(1);

/** Value for <input type="datetime-local"> in Mexico City time. */
export function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const shifted = new Date(new Date(value).getTime() - 6 * 3600_000);
  return shifted.toISOString().slice(0, 16);
}
/** <input type="datetime-local"> (Mexico City) -> ISO with offset, or null. */
export function fromLocalInput(value: string) {
  return value ? `${value}:00-06:00` : null;
}

export function isOverdue(
  nextActionAt: Date | string | null | undefined,
  status: string
) {
  return (
    Boolean(nextActionAt) &&
    new Date(nextActionAt!).getTime() < Date.now() &&
    status !== "qualified" &&
    status !== "archived"
  );
}

export function downloadText(
  filename: string,
  content: string,
  type = "text/csv;charset=utf-8"
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
