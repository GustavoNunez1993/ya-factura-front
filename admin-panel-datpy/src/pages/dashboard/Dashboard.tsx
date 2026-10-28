import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Skeleton } from "primereact/skeleton";
import { SelectButton } from "primereact/selectbutton";
import Swal from "sweetalert2";
import { DashboardService, type DashboardResumen, type FacturaResumen } from "../../services/DashboardService";
import { verificarCajaAbierta } from "../../utils/caja";
import { useUsaCaja } from "../../hooks/useUsaCaja";
import { estiloTipoDocumento, nombreTipoDocumento } from "../../services/FacturaService";
import { formatMonto } from "../../utils/moneda";
import type { MontoMoneda } from "../../services/FacturaService";
import "./dashboard.css";

/**
 * Importes de varias monedas, uno por renglón: nunca se suman monedas distintas. El primero
 * (guaraníes si hay) va destacado; sin movimientos, Gs. 0.
 */
function MontosPorMoneda({ montos, grande = false }: { montos: MontoMoneda[]; grande?: boolean }) {
  const lista = montos.length > 0 ? montos : [{ monedaId: 1, total: 0 }];
  const [principal, ...resto] = lista;
  return (
    <div>
      <div style={grande ? { fontSize: "2rem", fontWeight: 700, lineHeight: 1.15 } : undefined}>
        {formatMonto(principal.total, principal.monedaId)}
      </div>
      {resto.map((m) => (
        <div key={m.monedaId} style={grande ? { fontSize: "1.15rem", fontWeight: 600 } : undefined}>
          {formatMonto(m.total, m.monedaId)}
        </div>
      ))}
    </div>
  );
}

const resumenVacio: DashboardResumen = {
  ventasPorMoneda: [],
  ventasEquivalenteGs: 0,
  facturasEmitidasPeriodo: 0,
  documentosEmitidosPeriodo: 0,
  documentosPorTipo: [],
  productosActivos: 0,
  productosInactivos: 0,
  clientesActivos: 0,
  tendenciaVentas: [],
  facturacionSemanal: [],
  facturasRecientes: [],
  facturasPendientes: [],
  cobrosPorMoneda: [],
  saldoPendientePorMoneda: [],
  cobrosPorFormaPago: [],
  ultimosCobros: [],
  productosPorVencer: []
};

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const formatFechaParam = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const inicioDeMes = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const finDeMes = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);


const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function Dashboard() {
  const navigate = useNavigate();

  const hoy = startOfDay(new Date());

  const [resumen, setResumen] = useState<DashboardResumen>(resumenVacio);
  const [loading, setLoading] = useState(true);
  const usaCaja = useUsaCaja();
  // Moneda que muestra la dona de cobros por forma de pago (no se mezclan monedas en un mismo reparto).
  const [monedaFormaPago, setMonedaFormaPago] = useState<string | null>(null);
  // Rango por defecto: el mes actual completo (del 1 al último día).
  const [fechaDesde, setFechaDesde] = useState<Date>(() => inicioDeMes(hoy));
  const [fechaHasta, setFechaHasta] = useState<Date>(() => finDeMes(hoy));

  const esHoy = mismoDia(fechaDesde, hoy) && mismoDia(fechaHasta, hoy);
  const esMesActual = mismoDia(fechaDesde, inicioDeMes(hoy)) && mismoDia(fechaHasta, finDeMes(hoy));
  const textoPeriodo = esHoy ? "hoy" : esMesActual ? "en el mes actual" : "en el período seleccionado";

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getResumen(fechaDesde, fechaHasta);

        if (activo) {
          setResumen(data);
        }
      } catch (error) {
        console.error("Error al cargar el dashboard:", error);

        Swal.fire({
          icon: "error",
          title: "No se pudo cargar el dashboard",
          text: "Intente nuevamente en unos instantes",
          confirmButtonColor: "#4361ee"
        });
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [fechaDesde, fechaHasta]);

  const irAHoy = () => {
    setFechaDesde(hoy);
    setFechaHasta(hoy);
  };

  const irAMesActual = () => {
    setFechaDesde(inicioDeMes(hoy));
    setFechaHasta(finDeMes(hoy));
  };

  const [loadingNuevaFactura, setLoadingNuevaFactura] = useState(false);

  const irANuevaFactura = async () => {
    try {
      setLoadingNuevaFactura(true);
      if (await verificarCajaAbierta()) navigate("/facturacion-create");
    } finally {
      setLoadingNuevaFactura(false);
    }
  };

  const lineData = {
    labels: resumen.tendenciaVentas.map((item) => item.label),
    datasets: [
      {
        label: "Ventas",
        data: resumen.tendenciaVentas.map((item) => item.total),
        borderColor: "#6d28d9",
        backgroundColor: "rgba(109, 40, 217, 0.14)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#6d28d9",
        pointBorderColor: "#6d28d9",
        pointRadius: 4
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#334155"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { color: "#eef2f7" }
      },
      y: {
        ticks: { color: "#64748b" },
        grid: { color: "#eef2f7" }
      }
    }
  };

  const barData = {
    labels: resumen.facturacionSemanal.map((item) => item.label),
    datasets: [
      {
        label: "Facturas",
        backgroundColor: "#22c55e",
        borderRadius: 8,
        data: resumen.facturacionSemanal.map((item) => item.cantidad)
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#334155"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#64748b" },
        grid: { display: false }
      },
      y: {
        ticks: { color: "#64748b", precision: 0 },
        grid: { color: "#eef2f7" }
      }
    }
  };

  const totalProductos = resumen.productosActivos + resumen.productosInactivos;

  const doughnutData = {
    labels: ["Activos", "Inactivos"],
    datasets: [
      {
        data: totalProductos > 0
          ? [resumen.productosActivos, resumen.productosInactivos]
          : [1, 0],
        backgroundColor: ["#7c3aed", "#cbd5e1"],
        hoverBackgroundColor: ["#6d28d9", "#94a3b8"]
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#334155"
        }
      }
    }
  };

  const formaPagoPalette = ["#0d9488", "#f59e0b", "#6d28d9", "#0ea5e9", "#f43f5e", "#64748b", "#22c55e", "#eab308"];

  // Guaraníes primero; la elegida si sigue habiendo cobros en ella, si no la primera.
  const monedasFormaPago = [...new Set(resumen.cobrosPorFormaPago.map((item) => item.moneda ?? "PYG"))].sort(
    (a, b) => (a === "PYG" ? -1 : b === "PYG" ? 1 : a.localeCompare(b))
  );
  const monedaElegida =
    monedaFormaPago && monedasFormaPago.includes(monedaFormaPago) ? monedaFormaPago : monedasFormaPago[0] ?? "PYG";
  const formasDeLaMoneda = resumen.cobrosPorFormaPago.filter((item) => (item.moneda ?? "PYG") === monedaElegida);
  // El color sigue a la forma de pago (mismo color en todas las monedas), no a su posición.
  const formasPago = [...new Set(resumen.cobrosPorFormaPago.map((item) => item.descripcion))].sort();
  const colorForma = (descripcion: string) =>
    formaPagoPalette[formasPago.indexOf(descripcion) % formaPagoPalette.length];

  const cobrosFormaPagoData = {
    labels: formasDeLaMoneda.map((item) => item.descripcion),
    datasets: [
      {
        data: formasDeLaMoneda.map((item) => item.monto),
        backgroundColor: formasDeLaMoneda.map((item) => colorForma(item.descripcion)),
        hoverBackgroundColor: formasDeLaMoneda.map((item) => colorForma(item.descripcion))
      }
    ]
  };

  const cobrosFormaPagoOptions = {
    ...doughnutOptions,
    plugins: {
      ...doughnutOptions.plugins,
      tooltip: {
        callbacks: {
          label: (item: { label: string; parsed: number }) => `${item.label}: ${formatMonto(item.parsed, monedaElegida)}`
        }
      }
    }
  };

  const formatFecha = (value: string) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("es-PY");
  };

  const diasParaVencer = (vencimiento: string | null) => {
    if (!vencimiento) return null;

    const hoyLocal = startOfDay(new Date());
    const fechaVencimiento = startOfDay(new Date(vencimiento));

    return Math.round((fechaVencimiento.getTime() - hoyLocal.getTime()) / (1000 * 60 * 60 * 24));
  };

  const estadoBodyTemplate = (rowData: FacturaResumen) => {
    const severity =
      rowData.estado === "Pagado"
        ? "success"
        : rowData.estado === "Pendiente"
          ? "warning"
          : "danger";

    return <Tag value={rowData.estado} severity={severity} />;
  };

  const fechaBodyTemplate = (rowData: FacturaResumen) => {
    return formatFecha(rowData.dFeEmiDE);
  };

  const totalBodyTemplate = (rowData: FacturaResumen) => {
    return <span style={{ fontWeight: 600 }}>{formatMonto(rowData.total, rowData.monedaId)}</span>;
  };

  const cardBaseStyle = {
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05)"
  };

  /**
   * Listado de cada tipo de documento con el mismo período del dashboard. NC y ND no tienen
   * listado propio: van a Documentos Electrónicos filtrado por su tipo.
   */
  const rutaListadoTipo = (tipo: number) => {
    const periodo = `desde=${formatFechaParam(fechaDesde)}&hasta=${formatFechaParam(fechaHasta)}`;
    switch (tipo) {
      case 1:
        return `/facturacion?${periodo}`;
      case 4:
        return `/autofacturas?${periodo}`;
      case 5:
        return `/notas-credito?${periodo}`;
      case 6:
        return `/notas-debito?${periodo}`;
      case 7:
        return `/notas-remision?${periodo}`;
      default:
        return `/documentos-electronicos?tipo=${tipo}&${periodo}`;
    }
  };

  const kpiProps = (path: string) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => navigate(path),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigate(path);
      }
    }
  });

  return (
    <div className="p-3 md:p-4">
      <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-900" style={{ fontSize: "2rem", fontWeight: 700 }}>
            Dashboard
          </h2>
          <span className="text-600">Resumen general del sistema administrativo</span>
        </div>

        <div className="dashboard-daterange flex align-items-center gap-2 flex-wrap">
          <div
            className="flex align-items-center gap-2 px-3 py-2 border-round-xl"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)"
            }}
          >
            <i className="pi pi-calendar text-primary" />

            <Calendar
              value={fechaDesde}
              dateFormat="dd/mm/yy"
              maxDate={fechaHasta}
              inputClassName="dashboard-daterange-input"
              onChange={(e) => e.value && setFechaDesde(startOfDay(e.value as Date))}
            />

            <span className="text-600">-</span>

            <Calendar
              value={fechaHasta}
              dateFormat="dd/mm/yy"
              minDate={fechaDesde}
              inputClassName="dashboard-daterange-input"
              onChange={(e) => e.value && setFechaHasta(startOfDay(e.value as Date))}
            />
          </div>

          {!esHoy && (
            <Button
              label="Hoy"
              size="small"
              text
              onClick={irAHoy}
            />
          )}
          {!esMesActual && (
            <Button
              label="Este mes"
              size="small"
              text
              onClick={irAMesActual}
            />
          )}
        </div>
      </div>

      {/* Accesos rápidos: una barra compacta, no una tarjeta, para no robarle espacio a los indicadores. */}
      <div className="dashboard-quick-actions flex align-items-center flex-wrap gap-2 mb-4">
        <span className="text-600 text-sm mr-1">Accesos rápidos:</span>
        <Button
          label="Nueva Factura"
          icon="pi pi-file-plus"
          size="small"
          className="dashboard-quick-btn"
          loading={loadingNuevaFactura}
          onClick={irANuevaFactura}
        />
        <Button
          label="Nuevo Cliente"
          icon="pi pi-user-plus"
          size="small"
          outlined
          className="dashboard-quick-btn"
          onClick={() => navigate("/personas")}
        />
        <Button
          label="Nuevo Producto"
          icon="pi pi-box"
          size="small"
          outlined
          className="dashboard-quick-btn"
          onClick={() => navigate("/productos")}
        />
        {usaCaja && (
          <Button
            label="Apertura Caja"
            icon="pi pi-wallet"
            size="small"
            outlined
            className="dashboard-quick-btn"
            onClick={() => navigate("/apertura-caja")}
          />
        )}
      </div>

      <div className="grid">
        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi dashboard-kpi-clickable p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #a100ff 0%, #7c3aed 100%)",
              boxShadow: "0 10px 25px rgba(124, 58, 237, 0.25)"
            }}
            {...kpiProps("/facturacion")}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">{esHoy ? "Ventas Hoy" : esMesActual ? "Ventas del Mes" : "Ventas del Período"}</div>
                {loading ? (
                  <Skeleton width="7rem" height="2rem" className="dashboard-skeleton" />
                ) : (
                  <MontosPorMoneda montos={resumen.ventasPorMoneda} grande />
                )}
              </div>

              <div
                className="flex align-items-center justify-content-center border-circle"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255,255,255,0.18)"
                }}
              >
                <i className="pi pi-wallet" style={{ fontSize: "1.2rem" }} />
              </div>
            </div>

            <div className="text-sm opacity-80">
              Facturas + notas de débito − notas de crédito {textoPeriodo}
              {resumen.ventasPorMoneda.some((m) => m.monedaId !== 1) && (
                <div className="mt-1">
                  Equivalente total: {formatMonto(resumen.ventasEquivalenteGs, 1)} (cotización de cada comprobante)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi dashboard-kpi-clickable p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.22)"
            }}
            {...kpiProps("/facturacion")}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Facturas Emitidas</div>
                {loading ? (
                  <Skeleton width="4rem" height="2rem" className="dashboard-skeleton" />
                ) : (
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{resumen.facturasEmitidasPeriodo}</div>
                )}
              </div>

              <div
                className="flex align-items-center justify-content-center border-circle"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255,255,255,0.18)"
                }}
              >
                <i className="pi pi-receipt" style={{ fontSize: "1.2rem" }} />
              </div>
            </div>

            <div className="text-sm opacity-80">
              {`Facturas ${textoPeriodo} · ${resumen.documentosEmitidosPeriodo} documentos electrónicos en total`}
            </div>
          </div>
        </div>

        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi dashboard-kpi-clickable p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #00d26a 100%)",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.22)"
            }}
            {...kpiProps("/productos")}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Productos Activos</div>
                {loading ? (
                  <Skeleton width="4rem" height="2rem" className="dashboard-skeleton" />
                ) : (
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{resumen.productosActivos}</div>
                )}
              </div>

              <div
                className="flex align-items-center justify-content-center border-circle"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255,255,255,0.18)"
                }}
              >
                <i className="pi pi-box" style={{ fontSize: "1.2rem" }} />
              </div>
            </div>

            <div className="text-sm opacity-80">Productos disponibles para venta</div>
          </div>
        </div>

        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi dashboard-kpi-clickable p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ff7a00 100%)",
              boxShadow: "0 10px 25px rgba(249, 115, 22, 0.22)"
            }}
            {...kpiProps("/personas")}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Clientes Activos</div>
                {loading ? (
                  <Skeleton width="4rem" height="2rem" className="dashboard-skeleton" />
                ) : (
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{resumen.clientesActivos}</div>
                )}
              </div>

              <div
                className="flex align-items-center justify-content-center border-circle"
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(255,255,255,0.18)"
                }}
              >
                <i className="pi pi-users" style={{ fontSize: "1.2rem" }} />
              </div>
            </div>

            <div className="text-sm opacity-80">Clientes registrados en el sistema</div>
          </div>
        </div>

        <div className="col-12">
          <Card className="border-round-2xl" style={cardBaseStyle}>
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  Documentos Electrónicos
                </div>
                <div className="text-600">{`Comprobantes emitidos ${textoPeriodo}, por tipo`}</div>
              </div>
              <div className="flex align-items-center gap-3 flex-wrap">
                {!loading && (
                  <span className="text-600">
                    Total: <strong className="text-900">{resumen.documentosEmitidosPeriodo}</strong> documentos
                  </span>
                )}
                <Button label="Ver todos" icon="pi pi-arrow-right" iconPos="right" size="small" text onClick={() => navigate(`/documentos-electronicos?desde=${formatFechaParam(fechaDesde)}&hasta=${formatFechaParam(fechaHasta)}`)} />
              </div>
            </div>

            <div className="grid">
              {(loading ? [1, 4, 5, 6, 7].map((tipo) => ({ tipo, emitidos: 0, anulados: 0, totales: [] as MontoMoneda[] })) : resumen.documentosPorTipo).map((d) => {
                const estilo = estiloTipoDocumento(d.tipo);
                return (
                  <div key={d.tipo} className="col-12 sm:col-6 lg:col">
                    <div
                      className="p-3 border-round-xl h-full dashboard-doc-tile"
                      style={{ border: `1px solid ${estilo.color}33`, background: `${estilo.color}0d` }}
                      title={`Ver ${nombreTipoDocumento(d.tipo).toLowerCase()}s del período`}
                      {...kpiProps(rutaListadoTipo(d.tipo))}
                    >
                      <div className="flex align-items-center gap-2 mb-2">
                        <i className={estilo.icon} style={{ color: estilo.color }} />
                        <span className="font-semibold text-900">{nombreTipoDocumento(d.tipo)}</span>
                      </div>
                      {loading ? (
                        <Skeleton width="3rem" height="1.8rem" className="dashboard-skeleton" />
                      ) : (
                        <>
                          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: estilo.color }}>{d.emitidos}</div>
                          <div className="text-600 text-sm">
                            {d.tipo === 7
                              ? "Sin importe"
                              : (d.totales.length > 0 ? d.totales : [{ monedaId: 1, total: 0 }])
                                  .map((m) => formatMonto(m.total, m.monedaId))
                                  .join(" · ")}
                            {d.tipo === 4 && " en compras"}
                          </div>
                          {d.anulados > 0 && (
                            <div className="text-sm mt-1" style={{ color: "#dc2626" }}>
                              {d.anulados} anulado{d.anulados === 1 ? "" : "s"}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="border-round-2xl" style={cardBaseStyle}>
            <div className="mb-4">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Cobros
              </div>
              <div className="text-600">
                {`Pagos recibidos y saldo por cobrar ${textoPeriodo}`}
              </div>
            </div>

            <div className="grid">
              <div className="col-12 md:col-6 xl:col-3">
                <div
                  className="dashboard-kpi p-4 border-round-2xl text-white h-full"
                  style={{
                    background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
                    boxShadow: "0 10px 25px rgba(13, 148, 136, 0.22)"
                  }}
                >
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="text-sm opacity-80 mb-2">Cobros del Período</div>
                      {loading ? (
                        <Skeleton width="7rem" height="2rem" className="dashboard-skeleton" />
                      ) : (
                        <MontosPorMoneda montos={resumen.cobrosPorMoneda} grande />
                      )}
                    </div>

                    <div
                      className="flex align-items-center justify-content-center border-circle"
                      style={{ width: 48, height: 48, background: "rgba(255,255,255,0.18)" }}
                    >
                      <i className="pi pi-money-bill" style={{ fontSize: "1.2rem" }} />
                    </div>
                  </div>

                  <div className="text-sm opacity-80">
                    {esHoy ? "Total cobrado en la fecha actual" : "Total cobrado en el período seleccionado"}
                  </div>
                </div>
              </div>

              <div className="col-12 md:col-6 xl:col-3">
                <div
                  className="dashboard-kpi dashboard-kpi-clickable p-4 border-round-2xl text-white h-full"
                  style={{
                    background: "linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)",
                    boxShadow: "0 10px 25px rgba(225, 29, 72, 0.22)"
                  }}
                  {...kpiProps("/cuenta-corriente/clientes")}
                >
                  <div className="flex justify-content-between align-items-start mb-3">
                    <div>
                      <div className="text-sm opacity-80 mb-2">Saldo Pendiente de Cobro</div>
                      {loading ? (
                        <Skeleton width="7rem" height="2rem" className="dashboard-skeleton" />
                      ) : (
                        <MontosPorMoneda montos={resumen.saldoPendientePorMoneda} grande />
                      )}
                    </div>

                    <div
                      className="flex align-items-center justify-content-center border-circle"
                      style={{ width: 48, height: 48, background: "rgba(255,255,255,0.18)" }}
                    >
                      <i className="pi pi-exclamation-circle" style={{ fontSize: "1.2rem" }} />
                    </div>
                  </div>

                  <div className="text-sm opacity-80">Saldo total de facturas a crédito sin cobrar</div>
                </div>
              </div>

              <div className="col-12 xl:col-6">
                <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <div className="text-900 font-medium">Cobros por Forma de Pago</div>
                  {monedasFormaPago.length > 1 && (
                    <SelectButton
                      value={monedaElegida}
                      options={monedasFormaPago.map((m) => ({ label: m, value: m }))}
                      allowEmpty={false}
                      onChange={(e) => setMonedaFormaPago(e.value)}
                      pt={{ button: { className: "p-button-sm" } }}
                    />
                  )}
                </div>

                <div style={{ height: "180px" }}>
                  {loading ? (
                    <Skeleton width="100%" height="100%" className="dashboard-skeleton" />
                  ) : resumen.cobrosPorFormaPago.length === 0 ? (
                    <div className="flex align-items-center justify-content-center h-full text-600">
                      Aún no hay cobros registrados en el período
                    </div>
                  ) : (
                    <Chart type="doughnut" data={cobrosFormaPagoData} options={cobrosFormaPagoOptions} />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-900 font-medium mb-3">Últimos Cobros</div>

              {loading ? (
                <div className="flex flex-column gap-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} width="100%" height="3.5rem" className="dashboard-skeleton" />
                  ))}
                </div>
              ) : resumen.ultimosCobros.length === 0 ? (
                <div className="flex flex-column align-items-center justify-content-center text-center py-4">
                  <i className="pi pi-inbox text-400 mb-2" style={{ fontSize: "1.8rem" }} />
                  <span className="text-600">No hay cobros registrados en el período</span>
                </div>
              ) : (
                <div className="flex flex-column gap-3">
                  {resumen.ultimosCobros.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border-round-xl flex align-items-center justify-content-between flex-wrap gap-2"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                    >
                      <div className="flex align-items-center gap-3">
                        <i className="pi pi-check-circle text-teal-500" />
                        <div>
                          <div className="text-900 font-medium">{item.clienteNombre || "Sin cliente"}</div>
                          <small className="text-600">{item.facturaNumero} · {formatFecha(item.fecha)}</small>
                        </div>
                      </div>

                      <span className="font-semibold text-teal-600">
                        {formatMonto(item.monto, item.monedaId)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 xl:col-8">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  Tendencia de Ventas
                </div>
                <div className="text-600">
                  Ventas netas por mes (facturas + ND − NC), en guaraníes: lo facturado en otra moneda se
                  convierte con la cotización de cada comprobante
                </div>
              </div>

              <div
                className="px-3 py-2 border-round-lg text-sm"
                style={{ background: "#eef2ff", color: "#6d28d9", fontWeight: 600 }}
              >
                Últimos 6 meses
              </div>
            </div>

            <div style={{ height: "320px" }}>
              {loading ? (
                <Skeleton width="100%" height="100%" className="dashboard-skeleton" />
              ) : (
                <Chart type="line" data={lineData} options={lineOptions} />
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 xl:col-4">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="mb-3">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Estado de Productos
              </div>
              <div className="text-600">Resumen general del catálogo</div>
            </div>

            <div style={{ height: "320px" }}>
              {loading ? (
                <Skeleton width="100%" height="100%" className="dashboard-skeleton" />
              ) : totalProductos === 0 ? (
                <div className="flex align-items-center justify-content-center h-full text-600">
                  Aún no hay productos cargados
                </div>
              ) : (
                <Chart type="doughnut" data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-7">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="mb-3">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Facturación Semanal
              </div>
              <div className="text-600">Facturas emitidas por día (últimos 7 días)</div>
            </div>

            <div style={{ height: "300px" }}>
              {loading ? (
                <Skeleton width="100%" height="100%" className="dashboard-skeleton" />
              ) : (
                <Chart type="bar" data={barData} options={barOptions} />
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-5">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="mb-4">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Facturas Pendientes
              </div>
              <div className="text-600">
                {esHoy ? "Cobros a realizar hoy" : "Cobros a realizar en el período seleccionado"}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-column gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} width="100%" height="4rem" className="dashboard-skeleton" />
                ))}
              </div>
            ) : resumen.facturasPendientes.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center text-center py-4">
                <i className="pi pi-check-circle text-green-500 mb-2" style={{ fontSize: "1.8rem" }} />
                <span className="text-600">No hay facturas pendientes de cobro</span>
              </div>
            ) : (
              <div className="flex flex-column gap-3">
                {resumen.facturasPendientes.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border-round-xl flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <div className="flex align-items-center gap-3">
                      <i className="pi pi-exclamation-triangle text-orange-500" />
                      <div>
                        <div className="text-900 font-medium">{item.clienteRazonSocial || "Sin cliente"}</div>
                        <small className="text-600">{item.dNumDoc} · {formatFecha(item.dFeEmiDE)}</small>
                      </div>
                    </div>

                    <span className="font-semibold text-orange-600">
                      {formatMonto(item.total, item.monedaId)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col-12">
          <Card className="border-round-2xl" style={cardBaseStyle}>
            <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  Productos por Vencer
                </div>
                <div className="text-600">Stock con vencimiento en los próximos 15 días</div>
              </div>

              <Button
                label="Ver Stock"
                icon="pi pi-arrow-right"
                iconPos="right"
                outlined
                className="dashboard-table-btn"
                onClick={() => navigate("/stock")}
              />
            </div>

            {loading ? (
              <div className="flex flex-column gap-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} width="100%" height="4rem" className="dashboard-skeleton" />
                ))}
              </div>
            ) : resumen.productosPorVencer.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center text-center py-4">
                <i className="pi pi-check-circle text-green-500 mb-2" style={{ fontSize: "1.8rem" }} />
                <span className="text-600">No hay productos por vencer en los próximos 15 días</span>
              </div>
            ) : (
              <div className="flex flex-column gap-3">
                {resumen.productosPorVencer.map((item) => {
                  const dias = diasParaVencer(item.vencimiento);
                  const vencido = dias !== null && dias < 0;

                  return (
                    <div
                      key={item.id}
                      className="p-3 border-round-xl flex align-items-center justify-content-between flex-wrap gap-2"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                    >
                      <div className="flex align-items-center gap-3">
                        <i className={`pi ${vencido ? "pi-times-circle text-red-500" : "pi-clock text-orange-500"}`} />
                        <div>
                          <div className="text-900 font-medium">{item.productoDescripcion}</div>
                          <small className="text-600">
                            {item.depositoNombre}
                            {item.lote ? ` · Lote: ${item.lote}` : ""} · Vto: {formatFecha(item.vencimiento ?? "")}
                          </small>
                        </div>
                      </div>

                      <Tag
                        value={vencido ? `Vencido hace ${Math.abs(dias!)} día${Math.abs(dias!) === 1 ? "" : "s"}` : `Vence en ${dias} día${dias === 1 ? "" : "s"}`}
                        severity={vencido ? "danger" : "warning"}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="col-12">
          <Card className="border-round-2xl" style={cardBaseStyle}>
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  Últimas Facturas
                </div>
                <div className="text-600">
                  {esHoy ? "Resumen de documentos recientes" : "Documentos del período seleccionado"}
                </div>
              </div>

              <Button
                label="Ver Todas"
                icon="pi pi-arrow-right"
                iconPos="right"
                outlined
                className="dashboard-table-btn"
                onClick={() => navigate("/facturacion")}
              />
            </div>

            <DataTable
              value={resumen.facturasRecientes}
              loading={loading}
              responsiveLayout="scroll"
              stripedRows
              className="p-datatable-sm"
              emptyMessage="No hay facturas en el período seleccionado"
            >
              <Column field="dNumDoc" header="Número" />
              <Column field="clienteRazonSocial" header="Cliente" />
              <Column header="Fecha" body={fechaBodyTemplate} />
              <Column header="Total" body={totalBodyTemplate} />
              <Column header="Estado" body={estadoBodyTemplate} />
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
}
