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
import Swal from "sweetalert2";
import { DashboardService, type DashboardResumen, type FacturaResumen } from "../../services/DashboardService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";
import "./dashboard.css";

const resumenVacio: DashboardResumen = {
  ventasPeriodo: 0,
  facturasEmitidasPeriodo: 0,
  productosActivos: 0,
  productosInactivos: 0,
  clientesActivos: 0,
  tendenciaVentas: [],
  facturacionSemanal: [],
  facturasRecientes: [],
  facturasPendientes: [],
  cobrosPeriodo: 0,
  saldoPendienteCobro: 0,
  cobrosPorFormaPago: [],
  ultimosCobros: [],
  productosPorVencer: []
};

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function Dashboard() {
  const navigate = useNavigate();

  const hoy = startOfDay(new Date());

  const [resumen, setResumen] = useState<DashboardResumen>(resumenVacio);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState<Date>(hoy);
  const [fechaHasta, setFechaHasta] = useState<Date>(hoy);

  const esHoy = mismoDia(fechaDesde, hoy) && mismoDia(fechaHasta, hoy);

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

  const [loadingNuevaFactura, setLoadingNuevaFactura] = useState(false);

  const irANuevaFactura = async () => {
    try {
      setLoadingNuevaFactura(true);
      await CajaAperturaCierreService.getCajaAbierta(1);
      navigate("/facturacion-create");
    } catch {
      Swal.fire({
        icon: "warning",
        title: "Sin apertura de caja",
        text: "No hay una apertura de caja activa para el día de hoy. Realice la apertura de caja antes de emitir facturas.",
        confirmButtonText: "Ir a apertura de caja",
        showCancelButton: true,
        cancelButtonText: "Cancelar"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/apertura-caja");
        }
      });
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

  const cobrosFormaPagoData = {
    labels: resumen.cobrosPorFormaPago.map((item) => item.descripcion),
    datasets: [
      {
        data: resumen.cobrosPorFormaPago.map((item) => item.monto),
        backgroundColor: resumen.cobrosPorFormaPago.map((_, i) => formaPagoPalette[i % formaPagoPalette.length]),
        hoverBackgroundColor: resumen.cobrosPorFormaPago.map((_, i) => formaPagoPalette[i % formaPagoPalette.length])
      }
    ]
  };

  const formatGs = (value: number) => {
    return new Intl.NumberFormat("es-PY").format(Math.round(value));
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
    return <span style={{ fontWeight: 600 }}>Gs. {formatGs(rowData.total)}</span>;
  };

  const cardBaseStyle = {
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05)"
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
              maxDate={hoy}
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
        </div>
      </div>

      <Card
        className="border-round-2xl mb-4"
        style={cardBaseStyle}
      >
        <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <div className="text-900" style={{ fontSize: "1.3rem", fontWeight: 700 }}>
              Accesos Rápidos
            </div>
            <div className="text-600">Acciones principales del sistema</div>
          </div>
        </div>

        <div className="grid">
          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Nueva Factura"
              icon="pi pi-file-plus"
              className="w-full dashboard-action-btn"
              outlined
              loading={loadingNuevaFactura}
              onClick={irANuevaFactura}
            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Nuevo Cliente"
              icon="pi pi-user-plus"
              className="w-full dashboard-action-btn"
              outlined
              onClick={() => navigate("/personas")}
            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Nuevo Producto"
              icon="pi pi-box"
              className="w-full dashboard-action-btn"
              outlined
              onClick={() => navigate("/productos")}
            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Apertura Caja"
              icon="pi pi-wallet"
              className="w-full dashboard-action-btn"
              outlined
              onClick={() => navigate("/apertura-caja")}
            />
          </div>
        </div>
      </Card>

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
                <div className="text-sm opacity-80 mb-2">{esHoy ? "Ventas Hoy" : "Ventas del Período"}</div>
                {loading ? (
                  <Skeleton width="7rem" height="2rem" className="dashboard-skeleton" />
                ) : (
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                    Gs. {formatGs(resumen.ventasPeriodo)}
                  </div>
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
              {esHoy ? "Total vendido en la fecha actual" : "Total vendido en el período seleccionado"}
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
              {esHoy ? "Documentos generados hoy" : "Documentos generados en el período"}
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
            <div className="mb-4">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Cobros
              </div>
              <div className="text-600">
                {esHoy ? "Pagos recibidos y saldo por cobrar hoy" : "Pagos recibidos y saldo por cobrar en el período seleccionado"}
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
                        <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                          Gs. {formatGs(resumen.cobrosPeriodo)}
                        </div>
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
                        <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                          Gs. {formatGs(resumen.saldoPendienteCobro)}
                        </div>
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
                <div className="text-900 font-medium mb-2">Cobros por Forma de Pago</div>

                <div style={{ height: "180px" }}>
                  {loading ? (
                    <Skeleton width="100%" height="100%" className="dashboard-skeleton" />
                  ) : resumen.cobrosPorFormaPago.length === 0 ? (
                    <div className="flex align-items-center justify-content-center h-full text-600">
                      Aún no hay cobros registrados en el período
                    </div>
                  ) : (
                    <Chart type="doughnut" data={cobrosFormaPagoData} options={doughnutOptions} />
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
                        Gs. {formatGs(item.monto)}
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
                <div className="text-600">Comparativo mensual</div>
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
              <div className="text-600">Cantidad de documentos por día</div>
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
                      Gs. {formatGs(item.total)}
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
