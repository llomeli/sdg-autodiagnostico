import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ProspectDetail } from "./ProspectDetail";
import {
  downloadText,
  fmtDate,
  fmtScore,
  isOverdue,
  STATUS_KEYS,
  statusLabels,
  UNASSIGNED,
  type StatusKey,
} from "./format";

type Sort = "createdAt" | "overallScore" | "companyName" | "nextActionAt";
type FollowUp = "" | "overdue" | "today" | "week";

const SORTS: Array<{ value: `${Sort}:${"asc" | "desc"}`; label: string }> = [
  { value: "createdAt:desc", label: "Más recientes" },
  { value: "createdAt:asc", label: "Más antiguos" },
  { value: "nextActionAt:asc", label: "Siguiente paso más próximo" },
  { value: "overallScore:asc", label: "Menor madurez" },
  { value: "overallScore:desc", label: "Mayor madurez" },
  { value: "companyName:asc", label: "Empresa A–Z" },
];

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ProspectsView() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusKey[]>([]);
  const [sector, setSector] = useState("");
  const [urgency, setUrgency] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [followUp, setFollowUp] = useState<FollowUp>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] =
    useState<(typeof SORTS)[number]["value"]>("createdAt:desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const debouncedSearch = useDebounced(search.trim());

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status.length ? status : undefined,
      sector: sector || undefined,
      urgency: urgency || undefined,
      assignedTo: assignedTo || undefined,
      followUp: followUp || undefined,
      from: from || undefined,
      to: to || undefined,
    }),
    [debouncedSearch, status, sector, urgency, assignedTo, followUp, from, to]
  );
  const [sortKey, dir] = sort.split(":") as [Sort, "asc" | "desc"];

  useEffect(() => setPage(1), [filters, sort]);

  const options = trpc.admin.filterOptions.useQuery();
  const list = trpc.admin.listSubmissions.useQuery(
    { ...filters, sort: sortKey, dir, page, pageSize: 25 },
    { placeholderData: previous => previous }
  );
  const exportCsv = trpc.admin.exportCsv.useMutation({
    onSuccess: result => {
      downloadText(result.filename, result.csv);
      toast.success(
        `${result.rows} registros exportados${result.truncated ? " (límite de 5,000 alcanzado: acota los filtros)" : ""}.`
      );
    },
    onError: () => toast.error("No fue posible exportar."),
  });

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 25));
  const activeFilters = Boolean(
    search ||
      status.length ||
      sector ||
      urgency ||
      assignedTo ||
      followUp ||
      from ||
      to
  );
  const clear = () => {
    setSearch("");
    setStatus([]);
    setSector("");
    setUrgency("");
    setAssignedTo("");
    setFollowUp("");
    setFrom("");
    setTo("");
  };
  const toggleStatus = (key: StatusKey) =>
    setStatus(prev =>
      prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
    );
  const confirmExport = () => {
    const message = `Se descargará un CSV con datos personales de ${total} prospecto(s). Guárdalo sólo en ubicaciones autorizadas y elimínalo cuando ya no lo necesites. ¿Continuar?`;
    if (window.confirm(message)) exportCsv.mutate(filters);
  };

  return (
    <>
      <section className="filter-bar" aria-label="Filtros">
        <div className="filter-row">
          <label className="filter-search">
            <Search size={15} aria-hidden />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empresa, contacto o correo"
              aria-label="Buscar"
            />
          </label>
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            aria-label="Sector"
          >
            <option value="">Todos los sectores</option>
            {options.data?.sectors.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={urgency}
            onChange={e => setUrgency(e.target.value)}
            aria-label="Urgencia"
          >
            <option value="">Cualquier urgencia</option>
            {options.data?.urgencies.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={assignedTo}
            onChange={e => setAssignedTo(e.target.value)}
            aria-label="Responsable"
          >
            <option value="">Cualquier responsable</option>
            <option value={UNASSIGNED}>Sin asignar</option>
            {options.data?.assignees.map(item => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={followUp}
            onChange={e => setFollowUp(e.target.value as FollowUp)}
            aria-label="Seguimiento"
          >
            <option value="">Cualquier seguimiento</option>
            <option value="overdue">Siguiente paso vencido</option>
            <option value="today">Para hoy</option>
            <option value="week">Próximos 7 días</option>
          </select>
        </div>
        <div className="filter-row">
          <div className="status-chips" role="group" aria-label="Estatus">
            {STATUS_KEYS.map(key => (
              <button
                type="button"
                key={key}
                className={status.includes(key) ? "chip active" : "chip"}
                aria-pressed={status.includes(key)}
                onClick={() => toggleStatus(key)}
              >
                {statusLabels[key]}
              </button>
            ))}
          </div>
          <label className="filter-date">
            Desde{" "}
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={e => setFrom(e.target.value)}
            />
          </label>
          <label className="filter-date">
            Hasta{" "}
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={e => setTo(e.target.value)}
            />
          </label>
          {activeFilters && (
            <button type="button" className="text-button" onClick={clear}>
              <X size={14} /> Limpiar filtros
            </button>
          )}
          <span className="filter-spacer" />
          <button
            type="button"
            className="button button-outline small"
            onClick={() => list.refetch()}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
          <button
            type="button"
            className="button button-outline small"
            disabled={!total || exportCsv.isPending}
            onClick={confirmExport}
          >
            <Download size={14} />{" "}
            {exportCsv.isPending ? "Exportando…" : "Exportar CSV"}
          </button>
        </div>
      </section>

      <div className="admin-grid">
        <section className="leads-list">
          <div className="list-title">
            <h2>Registros</h2>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              aria-label="Ordenar"
            >
              {SORTS.map(item => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="list-count" aria-live="polite">
            {list.isLoading
              ? "Cargando…"
              : `${total} prospecto${total === 1 ? "" : "s"}${activeFilters ? " con estos filtros" : ""}`}
          </div>
          {list.error && (
            <p className="admin-error">
              No fue posible recuperar los registros.
            </p>
          )}
          {!list.isLoading && !list.data?.rows.length && (
            <div className="empty-leads">
              <UserRound size={28} />
              <p>
                {activeFilters
                  ? "Sin resultados"
                  : "Aún no hay prospectos capturados."}
              </p>
              <small>
                {activeFilters
                  ? "Ajusta o limpia los filtros."
                  : "Los registros enviados desde el autodiagnóstico aparecerán aquí."}
              </small>
            </div>
          )}
          {list.data?.rows.map(item => {
            const overdue = isOverdue(item.nextActionAt, item.status);
            return (
              <button
                className={`lead-row ${selectedId === item.id ? "selected" : ""}`}
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  // On narrow screens the detail sits below the list.
                  if (window.innerWidth < 900)
                    setTimeout(
                      () =>
                        document
                          .querySelector(".lead-detail")
                          ?.scrollIntoView({ behavior: "smooth" }),
                      50
                    );
                }}
              >
                <span className="lead-avatar">{item.fullName.slice(0, 1)}</span>
                <div>
                  <b>{item.companyName}</b>
                  <small>
                    {item.fullName} · {item.sector}
                  </small>
                  <span className="lead-meta">
                    <span className={`status-pill s-${item.status}`}>
                      {statusLabels[item.status]}
                    </span>
                    {item.assignedTo ? (
                      <span>{item.assignedTo}</span>
                    ) : (
                      <span className="muted">Sin asignar</span>
                    )}
                    {item.nextActionAt && (
                      <span className={overdue ? "overdue" : undefined}>
                        {overdue ? "Vencido · " : ""}
                        {fmtDate(item.nextActionAt)}
                      </span>
                    )}
                  </span>
                </div>
                <em title="Promedio general (0–5)">
                  {fmtScore(item.overallScore)}
                </em>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {total > 25 && (
            <nav className="pager" aria-label="Paginación">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </section>
        <ProspectDetail
          id={selectedId}
          assignees={options.data?.assignees ?? []}
          onChanged={() => {
            utils.admin.listSubmissions.invalidate();
            utils.admin.filterOptions.invalidate();
            utils.admin.dashboard.invalidate();
          }}
          onDeleted={() => setSelectedId(null)}
        />
      </div>
    </>
  );
}
