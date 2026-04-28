import { Chart } from "primereact/chart";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import "./dashboard.css";

type FacturaItem = {
  id: number;
  numero: string;
  cliente: string;
  fecha: string;
  total: number;
  estado: "Pagada" | "Pendiente" | "Anulada";
};

export default function Dashboard() {
  const ventasHoy = 0;
  const facturasEmitidas = 0;
  const productosActivos = 0;
  const clientesActivos = 0;

  const facturasRecientes: FacturaItem[] = [
    { id: 1, numero: "001-001-0000001", cliente: "Cliente Demo 1", fecha: "30/03/2026", total: 350000, estado: "Pagada" },
    { id: 2, numero: "001-001-0000002", cliente: "Cliente Demo 2", fecha: "30/03/2026", total: 125000, estado: "Pendiente" },
    { id: 3, numero: "001-001-0000003", cliente: "Cliente Demo 3", fecha: "29/03/2026", total: 780000, estado: "Pagada" },
    { id: 4, numero: "001-001-0000004", cliente: "Cliente Demo 4", fecha: "29/03/2026", total: 50000, estado: "Anulada" }
  ];

  const productosStockBajo = [
    { nombre: "Producto A", stock: 3 },
    { nombre: "Producto B", stock: 5 },
    { nombre: "Producto C", stock: 2 },
    { nombre: "Producto D", stock: 4 }
  ];

  const lineData = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    datasets: [
      {
        label: "Ventas",
        data: [1200000, 1900000, 1500000, 2200000, 1800000, 2500000],
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
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: "Facturas",
        backgroundColor: "#22c55e",
        borderRadius: 8,
        data: [3, 5, 2, 8, 4, 6, 1]
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
        ticks: { color: "#64748b" },
        grid: { color: "#eef2f7" }
      }
    }
  };

  const doughnutData = {
    labels: ["Activos", "Inactivos", "Bajo Stock"],
    datasets: [
      {
        data: [72, 18, 10],
        backgroundColor: ["#7c3aed", "#cbd5e1", "#f59e0b"],
        hoverBackgroundColor: ["#6d28d9", "#94a3b8", "#d97706"]
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

  const formatGs = (value: number) => {
    return new Intl.NumberFormat("es-PY").format(value);
  };

  const estadoBodyTemplate = (rowData: FacturaItem) => {
    const severity =
      rowData.estado === "Pagada"
        ? "success"
        : rowData.estado === "Pendiente"
          ? "warning"
          : "danger";

    return <Tag value={rowData.estado} severity={severity} />;
  };

  const totalBodyTemplate = (rowData: FacturaItem) => {
    return <span style={{ fontWeight: 600 }}>Gs. {formatGs(rowData.total)}</span>;
  };

  const cardBaseStyle = {
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 24px rgba(15, 23, 42, 0.05)"
  };

  const nuevaFactura = () => {
    window.location.href = "/facturacion-create";
  };

  return (
    <div className="p-3 md:p-4">
      <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="m-0 text-900" style={{ fontSize: "2rem", fontWeight: 700 }}>
            Dashboard
          </h2>
          <span className="text-600">Resumen general del sistema administrativo</span>
        </div>

        <div
          className="flex align-items-center gap-2 px-3 py-2 border-round-xl"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)"
          }}
        >
          <i className="pi pi-calendar text-primary" />
          <span className="text-700">Hoy</span>
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
              onClick={nuevaFactura}

            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Nuevo Cliente"
              icon="pi pi-user-plus"
              className="w-full dashboard-action-btn"
              outlined
            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Nuevo Producto"
              icon="pi pi-box"
              className="w-full dashboard-action-btn"
              outlined
            />
          </div>

          <div className="col-12 md:col-6 xl:col-3">
            <Button
              label="Apertura Caja"
              icon="pi pi-wallet"
              className="w-full dashboard-action-btn"
              outlined
            />
          </div>
        </div>
      </Card>

      <div className="grid">
        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #a100ff 0%, #7c3aed 100%)",
              boxShadow: "0 10px 25px rgba(124, 58, 237, 0.25)"
            }}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Ventas Hoy</div>
                <div style={{ fontSize: "2rem", fontWeight: 700 }}>
                  Gs. {formatGs(ventasHoy)}
                </div>
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

            <div className="text-sm opacity-80">Total vendido en la fecha actual</div>
          </div>
        </div>

        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.22)"
            }}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Facturas Emitidas</div>
                <div style={{ fontSize: "2rem", fontWeight: 700 }}>{facturasEmitidas}</div>
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

            <div className="text-sm opacity-80">Documentos generados hoy</div>
          </div>
        </div>

        <div className="col-12 md:col-6 xl:col-3">
          <div
            className="dashboard-kpi p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #00d26a 100%)",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.22)"
            }}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Productos Activos</div>
                <div style={{ fontSize: "2rem", fontWeight: 700 }}>{productosActivos}</div>
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
            className="dashboard-kpi p-4 border-round-2xl text-white h-full"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #ff7a00 100%)",
              boxShadow: "0 10px 25px rgba(249, 115, 22, 0.22)"
            }}
          >
            <div className="flex justify-content-between align-items-start mb-3">
              <div>
                <div className="text-sm opacity-80 mb-2">Clientes Activos</div>
                <div style={{ fontSize: "2rem", fontWeight: 700 }}>{clientesActivos}</div>
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

            <div className="text-sm opacity-80">Clientes habilitados en el sistema</div>
          </div>
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
              <Chart type="line" data={lineData} options={lineOptions} />
            </div>
          </Card>
        </div>

        <div className="col-12 xl:col-4">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="mb-3">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Estado de Productos
              </div>
              <div className="text-600">Resumen general de inventario</div>
            </div>

            <div style={{ height: "320px" }}>
              <Chart type="doughnut" data={doughnutData} options={doughnutOptions} />
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
              <Chart type="bar" data={barData} options={barOptions} />
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-5">
          <Card className="border-round-2xl h-full" style={cardBaseStyle}>
            <div className="mb-4">
              <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                Stock Bajo
              </div>
              <div className="text-600">Productos que requieren revisión</div>
            </div>

            <div className="flex flex-column gap-3">
              {productosStockBajo.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border-round-xl flex align-items-center justify-content-between"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                  <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-orange-500" />
                    <div>
                      <div className="text-900 font-medium">{item.nombre}</div>
                      <small className="text-600">Revisar reposición</small>
                    </div>
                  </div>

                  <span className="font-semibold text-orange-600">
                    Stock: {item.stock}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="border-round-2xl" style={cardBaseStyle}>
            <div className="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <div className="text-900" style={{ fontSize: "1.4rem", fontWeight: 700 }}>
                  Últimas Facturas
                </div>
                <div className="text-600">Resumen de documentos recientes</div>
              </div>

              <Button
                label="Ver Todas"
                icon="pi pi-arrow-right"
                iconPos="right"
                outlined
                className="dashboard-table-btn"
              />
            </div>

            <DataTable
              value={facturasRecientes}
              responsiveLayout="scroll"
              stripedRows
              className="p-datatable-sm"
              emptyMessage="No hay facturas recientes"
            >
              <Column field="numero" header="Número" />
              <Column field="cliente" header="Cliente" />
              <Column field="fecha" header="Fecha" />
              <Column header="Total" body={totalBodyTemplate} />
              <Column header="Estado" body={estadoBodyTemplate} />
            </DataTable>
          </Card>
        </div>
      </div>
    </div>
  );
}