
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import * as XLSX from "xlsx";


const API_URL = "https://sistemafacturacion-kkyv.onrender.com";

const PALETTE = [
  "#635BFF",
  "#16A68A",
  "#F59E0B",
  "#E65B75",
  "#8B5CF6",
];

type VentaMes = {
  mes: string;
  total: number;
};

type VentaCliente = {
  nombre: string;
  total: number;
};

type DashboardData = {
  totalFacturado: number;
  cantidadFacturas: number;
  promedioFactura: number;
  clienteEstrella?: {
    nombre: string;
    total: number;
  } | null;
  ventasPorMes: VentaMes[];
  ventasPorCliente: VentaCliente[];
};

type Factura = {
  id: number | string;
  numero: string | number;
  clienteNombre: string;
  fecha: string;
  total: number;
  estado: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value: number) => {
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000)
      .toLocaleString("es-CO", { maximumFractionDigits: 1 })} mil M`;
  }

  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000)
      .toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  }

  if (abs >= 1_000) {
    return `$${(value / 1_000)
      .toLocaleString("es-CO", { maximumFractionDigits: 0 })} mil`;
  }

  return money(value);
};

const numberFormat = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const dateFormat = (value: string) => {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
};

const normalizeArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

function Icon({
  name,
  size = 20,
}: {
  name: "money" | "file" | "chart" | "users" | "download" | "refresh" | "search" | "arrow" | "calendar" | "filter" | "clock";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<string, React.ReactNode> = {
    money: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M7 6V4h13v13M3 10h18" /><circle cx="12" cy="13" r="2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m7 14 4-4 4 3 6-7" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="report-tooltip">
      <span className="tooltip-label">{label}</span>
      <strong>{money(Number(payload[0].value))}</strong>
      <span className="tooltip-caption">Valor facturado</span>
    </div>
  );
}

export default function Reportes() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  const pageSize = 7;

  const cargarDatos = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const [dashboardResponse, facturasResponse] = await Promise.all([
        fetch(`${API_URL}/api/reportes/dashboard`),
        fetch(`${API_URL}/api/facturas`),
      ]);

      if (!dashboardResponse.ok || !facturasResponse.ok) {
        throw new Error("El servidor respondió con un error al consultar los datos.");
      }

      const [dashboardJson, facturasJson] = await Promise.all([
        dashboardResponse.json(),
        facturasResponse.json(),
      ]);

      if (!dashboardJson || typeof dashboardJson !== "object") {
        throw new Error("La respuesta del dashboard no tiene un formato válido.");
      }

      setData({
        ...dashboardJson,
        totalFacturado: Number(dashboardJson.totalFacturado) || 0,
        cantidadFacturas: Number(dashboardJson.cantidadFacturas) || 0,
        promedioFactura: Number(dashboardJson.promedioFactura) || 0,
        ventasPorMes: normalizeArray<VentaMes>(dashboardJson.ventasPorMes),
        ventasPorCliente: normalizeArray<VentaCliente>(
          dashboardJson.ventasPorCliente
        ),
      });

      setFacturas(normalizeArray<Factura>(facturasJson));
    } catch (err) {
      console.error("Error cargando reportes:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servidor."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();

    // El usuario puede actualizar los datos manualmente.
  }, [cargarDatos]);

  const facturasFiltradas = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-CO");

    return facturas.filter((factura) => {
      const coincideTexto =
        !query ||
        String(factura.numero ?? "").toLocaleLowerCase("es-CO").includes(query) ||
        String(factura.clienteNombre ?? "")
          .toLocaleLowerCase("es-CO")
          .includes(query);

      const coincideEstado =
        estadoFiltro === "Todos" || factura.estado === estadoFiltro;

      return coincideTexto && coincideEstado;
    });
  }, [facturas, search, estadoFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(facturasFiltradas.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);

  const facturasPagina = facturasFiltradas.slice(
    (paginaActual - 1) * pageSize,
    paginaActual * pageSize
  );

  const exportarExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    const resumen = [
      { Indicador: "Total facturado", Valor: data.totalFacturado },
      { Indicador: "Facturas emitidas", Valor: data.cantidadFacturas },
      { Indicador: "Ticket promedio", Valor: data.promedioFactura },
      {
        Indicador: "Cliente principal",
        Valor: data.clienteEstrella?.nombre || "Sin información",
      },
      {
        Indicador: "Facturación del cliente principal",
        Valor: data.clienteEstrella?.total || 0,
      },
      { Indicador: "Fecha de generación", Valor: new Date().toLocaleString("es-CO") },
    ];

    const agregarHoja = (nombre: string, filas: object[]) => {
      const sheet = XLSX.utils.json_to_sheet(filas);
      sheet["!cols"] = Object.keys(filas[0] || {}).map((key) => ({
        wch: Math.max(
          key.length + 3,
          ...filas.slice(0, 30).map((fila) =>
            String((fila as Record<string, unknown>)[key] ?? "").length + 2
          )
        ),
      }));
      XLSX.utils.book_append_sheet(wb, sheet, nombre);
    };

    agregarHoja("Resumen ejecutivo", resumen);
    agregarHoja("Ingresos por mes", data.ventasPorMes);
    agregarHoja("Top clientes", data.ventasPorCliente);
    agregarHoja(
      "Facturas",
      facturas.map((f) => ({
        Número: f.numero,
        Cliente: f.clienteNombre,
        Fecha: f.fecha,
        Total: f.total,
        Estado: f.estado,
      }))
    );

    XLSX.writeFile(
      wb,
      `Reporte_Ejecutivo_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (loading) {
    return (
      <main className="report-page">
        <div className="report-shell">
          <Skeleton className="skeleton-heading" />
          <div className="report-kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="skeleton-kpi" />
            ))}
          </div>
          <div className="report-chart-grid">
            <Skeleton className="skeleton-chart" />
            <Skeleton className="skeleton-chart" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="report-page">
        <div className="report-error">
          <div className="error-icon">!</div>
          <h2>No pudimos cargar tu información</h2>
          <p>{error}</p>
          <p className="error-hint">
            Verifica que el backend esté activo en <code>{API_URL}</code> y que
            los endpoints respondan correctamente.
          </p>
          <button className="report-btn report-btn-primary" onClick={() => void cargarDatos()}>
            <Icon name="refresh" size={17} /> Reintentar conexión
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      title: "Facturación total",
      value: money(data.totalFacturado),
      description: "Valor registrado en el sistema",
      icon: "money" as const,
      tone: "violet",
    },
    {
      title: "Facturas emitidas",
      value: numberFormat(data.cantidadFacturas),
      description: "Cantidad reportada por el sistema",
      icon: "file" as const,
      tone: "blue",
    },
    {
      title: "Ticket promedio",
      value: money(data.promedioFactura),
      description: "Promedio reportado por factura",
      icon: "chart" as const,
      tone: "green",
    },
    {
      title: "Cliente principal",
      value: data.clienteEstrella?.nombre || "Sin información",
      description: money(data.clienteEstrella?.total || 0),
      icon: "users" as const,
      tone: "amber",
    },
  ];

  return (
    <main className="report-page">
      <div className="report-shell">
        <header className="report-header">
          <div className="report-heading">
            <div className="report-eyebrow">
              <span className="live-dot" />
              CENTRO DE INTELIGENCIA DE NEGOCIO
            </div>
            <h1>
              Reportes <span>&amp; analítica</span>
            </h1>
            <p>
              Una visión clara de tu facturación, el comportamiento de tus
              clientes y el rendimiento del negocio.
            </p>
          </div>

          <div className="report-actions">
            <button
              className="report-btn report-btn-secondary"
              onClick={() => void cargarDatos(true)}
              disabled={refreshing}
            >
              <span className={refreshing ? "refresh-spinning" : ""}>
                <Icon name="refresh" size={17} />
              </span>
              {refreshing ? "Actualizando" : "Actualizar"}
            </button>
            <button
              className="report-btn report-btn-primary"
              onClick={exportarExcel}
            >
              <Icon name="download" size={17} />
              Exportar reporte
            </button>
          </div>
        </header>

        {error && (
          <div className="report-inline-error" role="status">
            No se pudo actualizar la información. Se muestran los últimos datos
            cargados. {error}
          </div>
        )}

        <section className="report-kpi-grid" aria-label="Indicadores principales">
          {kpis.map((kpi, index) => (
            <article className="report-kpi" key={kpi.title}>
              <div className="kpi-top">
                <span className="kpi-label">{kpi.title}</span>
                <span className={`kpi-icon kpi-icon-${kpi.tone}`}>
                  <Icon name={kpi.icon} size={21} />
                </span>
              </div>
              <div className={`kpi-number ${index === 3 ? "kpi-name" : ""}`}>
                {kpi.value}
              </div>
              <div className="kpi-bottom">
                <span className="kpi-indicator">
                  <span className="kpi-indicator-dot" />
                  {kpi.description}
                </span>
              </div>
              <div className={`kpi-accent kpi-accent-${kpi.tone}`} />
            </article>
          ))}
        </section>

        <section className="report-section-heading">
          <div>
            <span className="section-overline">ANÁLISIS FINANCIERO</span>
            <h2>Rendimiento del negocio</h2>
          </div>
          <span className="section-note">
            <Icon name="calendar" size={15} /> Según los datos disponibles
          </span>
        </section>

        <section className="report-chart-grid">
          <article className="report-panel revenue-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title-row">
                  <span className="panel-title-icon violet">
                    <Icon name="chart" size={18} />
                  </span>
                  <h3>Evolución de ingresos</h3>
                </div>
                <p>Comportamiento de la facturación a lo largo del tiempo</p>
              </div>
              <span className="panel-tag">INGRESOS</span>
            </div>

            <div className="chart-legend">
              <span className="legend-dot" />
              Total facturado
            </div>

            <div className="report-chart revenue-chart">
              {data.ventasPorMes.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.ventasPorMes}
                    margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="reportRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#635BFF" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#635BFF" stopOpacity={0.015} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="#EDF0F5"
                      strokeDasharray="4 5"
                    />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: "#8791A5", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={13}
                    />
                    <YAxis
                      tickFormatter={compactMoney}
                      tick={{ fill: "#8791A5", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={68}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#635BFF"
                      strokeWidth={3}
                      fill="url(#reportRevenueGradient)"
                      activeDot={{
                        r: 5,
                        fill: "#635BFF",
                        stroke: "#FFFFFF",
                        strokeWidth: 3,
                      }}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  No hay datos de facturación mensual disponibles.
                </div>
              )}
            </div>
            <div className="panel-footer">
              <span>Importes expresados en pesos colombianos (COP)</span>
            </div>
          </article>

          <article className="report-panel customers-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title-row">
                  <span className="panel-title-icon green">
                    <Icon name="users" size={18} />
                  </span>
                  <h3>Clientes destacados</h3>
                </div>
                <p>Clientes con mayor volumen de facturación</p>
              </div>
              <span className="panel-tag">TOP CLIENTES</span>
            </div>

            <div className="report-chart customers-chart">
              {data.ventasPorCliente.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.ventasPorCliente}
                    layout="vertical"
                    margin={{ top: 4, right: 14, left: 4, bottom: 4 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="#EDF0F5"
                      strokeDasharray="4 5"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={compactMoney}
                      tick={{ fill: "#8791A5", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={105}
                      tick={{ fill: "#566176", fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F6F7FB" }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={25}>
                      {data.ventasPorCliente.map((cliente, index) => (
                        <Cell
                          key={`${cliente.nombre}-${index}`}
                          fill={PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty">
                  No hay datos de clientes disponibles.
                </div>
              )}
            </div>
            <div className="panel-footer">
              <span>Clasificación según los datos del servidor</span>
            </div>
          </article>
        </section>

        <section className="report-panel transactions-panel">
          <div className="transactions-heading">
            <div>
              <div className="panel-title-row">
                <span className="panel-title-icon blue">
                  <Icon name="clock" size={18} />
                </span>
                <h3>Movimientos de facturación</h3>
              </div>
              <p>Consulta y encuentra rápidamente tus facturas</p>
            </div>
            <span className="transaction-count">
              {numberFormat(facturasFiltradas.length)} registros
            </span>
          </div>

          <div className="table-toolbar">
            <label className="report-search">
              <Icon name="search" size={18} />
              <input
                type="search"
                value={search}
                placeholder="Buscar por factura o cliente..."
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPagina(1);
                }}
                aria-label="Buscar facturas"
              />
              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Limpiar búsqueda"
                >
                  ×
                </button>
              )}
            </label>

            <label className="report-filter">
              <Icon name="filter" size={17} />
              <select
                value={estadoFiltro}
                onChange={(event) => {
                  setEstadoFiltro(event.target.value);
                  setPagina(1);
                }}
                aria-label="Filtrar por estado"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Emitida">Emitidas</option>
                <option value="Anulada">Anuladas</option>
              </select>
            </label>
          </div>

          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>FACTURA</th>
                  <th>CLIENTE</th>
                  <th>FECHA DE EMISIÓN</th>
                  <th className="align-right">VALOR TOTAL</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {facturasPagina.map((f) => {
                  const emitida = f.estado === "Emitida";

                  return (
                    <tr key={f.id}>
                      <td>
                        <span className="invoice-number">#{f.numero}</span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-avatar">
                            {String(f.clienteNombre || "?")
                              .trim()
                              .charAt(0)
                              .toLocaleUpperCase("es-CO")}
                          </span>
                          <span className="customer-name">
                            {f.clienteNombre || "Cliente no disponible"}
                          </span>
                        </div>
                      </td>
                      <td className="date-cell">{dateFormat(f.fecha)}</td>
                      <td className="align-right">
                        <span className="invoice-total">{money(f.total)}</span>
                      </td>
                      <td>
                        <span
                          className={`invoice-status ${
                            emitida ? "status-issued" : "status-cancelled"
                          }`}
                        >
                          <span className="status-dot" />
                          {f.estado || "Sin estado"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!facturasPagina.length && (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      <Icon name="search" size={23} />
                      <strong>No encontramos facturas</strong>
                      <span>Prueba con otro término o cambia el filtro.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <span>
              Mostrando{" "}
              <strong>
                {facturasFiltradas.length
                  ? (paginaActual - 1) * pageSize + 1
                  : 0}
                –{Math.min(paginaActual * pageSize, facturasFiltradas.length)}
              </strong>{" "}
              de <strong>{facturasFiltradas.length}</strong> registros
            </span>
            <div className="pagination-actions">
              <button
                className="pagination-btn"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="pagination-current">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                className="pagination-btn"
                disabled={paginaActual >= totalPaginas}
                onClick={() =>
                  setPagina((p) => Math.min(totalPaginas, p + 1))
                }
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>

        <footer className="report-footer">
          <span className="footer-brand">
            <span className="footer-brand-mark">N</span>
            Business Intelligence
          </span>
          <span>
            Panel de analítica <span className="footer-separator">·</span>{" "}
            <Icon name="refresh" size={12} /> Actualización bajo demanda
          </span>
        </footer>
      </div>
    </main>
  );
}
