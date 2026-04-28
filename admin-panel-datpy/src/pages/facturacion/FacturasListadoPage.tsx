import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";

import type { FacturaListadoFiltros } from "../../services/FacturaService";
import { FacturaService } from "../../services/FacturaService";

interface FacturaListado {
  id: string;
  dNumDoc: string;
  dEst: string;
  dPunExp: string;
  dFeEmiDE: string;
  condicionVenta: string;
  clienteRazonSocial: string;
  clienteDocumento: string;
  total: number;
  estado: string;
}

const condicionesVenta = [
  { label: "Contado", value: "CONTADO" },
  { label: "Crédito", value: "CREDITO" }
];

const getFechaActual = () => {
  const fechaActual = new Date();
  fechaActual.setHours(0, 0, 0, 0);

  return fechaActual;
};

const formatDateParam = (date: Date | null) => {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function FacturasListadoPage() {
  const [facturas, setFacturas] = useState<FacturaListado[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState<Date | null>(() => getFechaActual());
  const [fechaHasta, setFechaHasta] = useState<Date | null>(() => getFechaActual());
  const [condicionVenta, setCondicionVenta] = useState<string | null>(null);
  const [rucCliente, setRucCliente] = useState("");

  const [first, setFirst] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  const [informeVisible, setInformeVisible] = useState(false);
  const [facturaInforme, setFacturaInforme] = useState<any | null>(null);
  const [loadingInforme, setLoadingInforme] = useState(false);

  const obtenerFiltros = (): FacturaListadoFiltros => ({
    fechaDesde: formatDateParam(fechaDesde),
    fechaHasta: formatDateParam(fechaHasta),
    condicionVenta: condicionVenta ?? "",
    rucCliente: rucCliente.trim()
  });

  const cargarFacturas = async (
    pageValue = page,
    sizeValue = size,
    searchValue = search,
    filtrosValue = obtenerFiltros()
  ) => {
    try {
      setLoading(true);

      const res = await FacturaService.getPaginated(
        pageValue,
        sizeValue,
        searchValue,
        filtrosValue
      );

      setFacturas(res?.content ?? []);
      setTotalRecords(res?.totalElements ?? 0);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar el listado de facturas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFacturas(0, size, "");
  }, []);

  const onPage = (event: DataTablePageEvent) => {
    const nextPage = event.page ?? 0;
    const nextSize = event.rows;

    setFirst(event.first);
    setPage(nextPage);
    setSize(nextSize);

    cargarFacturas(nextPage, nextSize, search);
  };

  const buscar = () => {
    setFirst(0);
    setPage(0);
    cargarFacturas(0, size, search);
  };

  const limpiarFiltros = () => {
    const fechaActualDesde = getFechaActual();
    const fechaActualHasta = getFechaActual();
    const filtrosLimpios = {
      fechaDesde: formatDateParam(fechaActualDesde),
      fechaHasta: formatDateParam(fechaActualHasta),
      condicionVenta: "",
      rucCliente: ""
    };

    setSearch("");
    setFechaDesde(fechaActualDesde);
    setFechaHasta(fechaActualHasta);
    setCondicionVenta(null);
    setRucCliente("");
    setFirst(0);
    setPage(0);
    cargarFacturas(0, size, "", filtrosLimpios);
  };

  const nuevaFactura = () => {
    window.location.href = "/facturacion-create";
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const numeracionBody = (rowData: FacturaListado) => {
    return `${rowData.dEst}-${rowData.dPunExp}-${rowData.dNumDoc}`;
  };

  const fechaBody = (rowData: FacturaListado) => {
    if (!rowData.dFeEmiDE) return "-";
    return new Date(rowData.dFeEmiDE).toLocaleDateString("es-PY");
  };

  const totalBody = (rowData: FacturaListado) => {
    return formatMoney(rowData.total || 0);
  };

const estadoBody = (rowData: FacturaListado) => {
  const estado = rowData.estado || "Pendiente";
  const estadoLower = estado.toLowerCase();

  const severity =
    estadoLower === "pagado"
      ? "success"
      : estadoLower === "anulado" || estadoLower === "cancelado"
      ? "danger"
      : "warning";

  return <Tag value={estado} severity={severity as any} />;
};

  const condicionBody = (rowData: FacturaListado) => {
    const condicion = rowData.condicionVenta || "-";
    const esContado = condicion.toLowerCase() === "contado";

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          border: esContado ? "1px solid #86efac" : "1px solid #93c5fd",
          background: esContado ? "#f0fdf4" : "#eff6ff",
          color: esContado ? "#166534" : "#1d4ed8",
          fontWeight: 600,
          fontSize: "0.85rem"
        }}
      >
        {condicion}
      </span>
    );
  };

  const anularFactura = async (factura: FacturaListado) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Anular factura",
      text: `¿Desea anular la factura ${factura.dEst}-${factura.dPunExp}-${factura.dNumDoc}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    Swal.fire("Atención", "Todavía falta crear el endpoint de anulación.", "info");
  };

  const verInforme = async (factura: FacturaListado) => {
    try {
      setLoadingInforme(true);
      setFacturaInforme(null);
      setInformeVisible(true);

      const res = await FacturaService.getById(factura.id);

      setFacturaInforme(res);
    } catch (error) {
      console.error(error);
      setInformeVisible(false);
      Swal.fire("Error", "No se pudo obtener el informe de la factura", "error");
    } finally {
      setLoadingInforme(false);
    }
  };

  const imprimirInforme = () => {
    window.print();
  };

  const accionesBody = (rowData: FacturaListado) => {
    return (
      <div className="flex gap-2 justify-content-end">
        <Button
          icon="pi pi-file-pdf"
          severity="info"
          text
          rounded
          tooltip="Ver informe"
          onClick={() => verInforme(rowData)}
        />

        <Button
          icon="pi pi-ban"
          severity="danger"
          text
          rounded
          tooltip="Anular"
          onClick={() => anularFactura(rowData)}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="m-0">Listado de facturas</h2>
          <small className="text-color-secondary">
            Consulta de facturas emitidas
          </small>
        </div>

        <Button
          label="Nueva factura"
          icon="pi pi-plus"
          severity="success"
          onClick={nuevaFactura}
        />
      </div>

      <div className="grid mb-3">
        <div className="col-12 md:col-6 lg:col-3">
          <label>Buscar</label>
          <InputText
            className="w-full"
            value={search}
            placeholder="Cliente, documento o número"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") buscar();
            }}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-2">
          <label>Fecha desde</label>
          <Calendar
            className="w-full"
            inputClassName="w-full"
            value={fechaDesde}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            maxDate={fechaHasta ?? undefined}
            onChange={(e) => setFechaDesde(e.value ?? null)}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-2">
          <label>Fecha hasta</label>
          <Calendar
            className="w-full"
            inputClassName="w-full"
            value={fechaHasta}
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            minDate={fechaDesde ?? undefined}
            onChange={(e) => setFechaHasta(e.value ?? null)}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-2">
          <label>Condición venta</label>
          <Dropdown
            className="w-full"
            value={condicionVenta}
            options={condicionesVenta}
            placeholder="Todas"
            showClear
            onChange={(e) => setCondicionVenta(e.value)}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-2">
          <label>RUC cliente</label>
          <InputText
            className="w-full"
            value={rucCliente}
            placeholder="Ej: 80000000-1"
            onChange={(e) => setRucCliente(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") buscar();
            }}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-1 flex align-items-end gap-2">
          <Button
            icon="pi pi-search"
            onClick={buscar}
            loading={loading}
            tooltip="Buscar"
          />

          <Button
            icon="pi pi-filter-slash"
            severity="secondary"
            outlined
            onClick={limpiarFiltros}
            disabled={loading}
            tooltip="Limpiar filtros"
          />
        </div>
      </div>

      <DataTable
        value={facturas}
        loading={loading}
        lazy
        paginator
        first={first}
        rows={size}
        totalRecords={totalRecords}
        rowsPerPageOptions={[10, 20, 50]}
        onPage={onPage}
        dataKey="id"
        stripedRows
        size="small"
        emptyMessage="No hay facturas registradas"
      >
        <Column header="Numeración" body={numeracionBody} />
        <Column header="Fecha" body={fechaBody} />
        <Column field="clienteRazonSocial" header="Cliente" />
        <Column field="clienteDocumento" header="Documento" />
        <Column header="Condición de Venta" body={condicionBody} />
        <Column header="Total" body={totalBody} />
        <Column header="Estado" body={estadoBody} />
        <Column header="Acciones" body={accionesBody} style={{ width: "120px" }} />
      </DataTable>

      <Dialog
        header="Informe de factura"
        visible={informeVisible}
        modal
        style={{ width: "1100px", maxWidth: "98vw" }}
        onHide={() => setInformeVisible(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setInformeVisible(false)}
            />
            <Button
              label="Imprimir / PDF"
              icon="pi pi-print"
              onClick={imprimirInforme}
              disabled={!facturaInforme}
            />
          </div>
        }
      >
        {loadingInforme && <p>Cargando informe...</p>}

        {!loadingInforme && facturaInforme && (
          <div
            id="factura-informe-pdf"
            style={{
              padding: 24,
              background: "#ffffff",
              color: "#111827",
              fontFamily: "Arial, sans-serif",
              fontSize: 13
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "2px solid #111827",
                paddingBottom: 14,
                marginBottom: 18
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>Ya Factura</h2>
                <div>Sistema Administrativo</div>
                <div>
                  Punto de expedición: {facturaInforme.dEst}-{facturaInforme.dPunExp}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <h2 style={{ margin: 0 }}>BOLETA DE VENTA</h2>
                <div>
                  Fecha:{" "}
                  {facturaInforme.dFeEmiDE
                    ? new Date(facturaInforme.dFeEmiDE).toLocaleDateString("es-PY")
                    : "-"}
                </div>
                <div>
                  Condición:{" "}
                  {facturaInforme.condicionOperacionId === 2 ? "Crédito" : "Contado"}
                </div>
                <div>Moneda: PYG</div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px 48px",
                marginBottom: 18
              }}
            >
              <div>
                <strong>Cliente:</strong> {facturaInforme.clienteRazonSocial || "-"}
              </div>

              <div>
                <strong>Documento:</strong> {facturaInforme.clienteDocumento || "-"}
              </div>

              <div>
                <strong>Ítems:</strong> {facturaInforme.detalles?.length ?? 0}
              </div>

              <div>
                <strong>Total:</strong> {formatMoney(Number(facturaInforme.total || 0))}
              </div>
            </div>

            <h3 style={{ marginBottom: 8 }}>Detalle de productos</h3>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={thStyle}>Código</th>
                  <th style={thRightStyle}>Cant.</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thRightStyle}>Precio</th>
                  <th style={thRightStyle}>Exenta</th>
                  <th style={thRightStyle}>IVA 5</th>
                  <th style={thRightStyle}>IVA 10</th>
                  <th style={thRightStyle}>Subtotal</th>
                </tr>
              </thead>

              <tbody>
                {(facturaInforme.detalles ?? []).map((item: any) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.codigo}</td>
                    <td style={tdRightStyle}>{item.cantidad}</td>
                    <td style={tdStyle}>{item.descripcion}</td>
                    <td style={tdRightStyle}>
                      {formatMoney(Number(item.precioUnitario || 0))}
                    </td>
                    <td style={tdRightStyle}>
                      {formatMoney(Number(item.exenta || 0))}
                    </td>
                    <td style={tdRightStyle}>
                      {formatMoney(Number(item.iva5 || 0))}
                    </td>
                    <td style={tdRightStyle}>
                      {formatMoney(Number(item.iva10 || 0))}
                    </td>
                    <td style={tdRightStyle}>
                      {formatMoney(Number(item.total || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 300px",
                gap: 24,
                marginTop: 28
              }}
            >
              <div>
                <h3 style={{ marginBottom: 8 }}>Formas de pago</h3>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      <th style={thStyle}>Forma</th>
                      <th style={thStyle}>Referencia</th>
                      <th style={thRightStyle}>Monto</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(facturaInforme.pagos ?? []).map((pago: any) => (
                      <tr key={pago.id}>
                        <td style={tdStyle}>{pago.formaPago}</td>
                        <td style={tdStyle}>{pago.referencia || "-"}</td>
                        <td style={tdRightStyle}>
                          {formatMoney(Number(pago.monto || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 style={{ marginBottom: 8 }}>Totales</h3>

                <ResumenInforme
                  label="Exenta"
                  value={formatMoney(Number(facturaInforme.subtotal?.exenta || 0))}
                />
                <ResumenInforme
                  label="Subtotal IVA 5"
                  value={formatMoney(Number(facturaInforme.subtotal?.subtotalIva5 || 0))}
                />
                <ResumenInforme
                  label="Subtotal IVA 10"
                  value={formatMoney(Number(facturaInforme.subtotal?.subtotalIva10 || 0))}
                />
                <ResumenInforme
                  label="IVA 5"
                  value={formatMoney(Number(facturaInforme.subtotal?.iva5 || 0))}
                />
                <ResumenInforme
                  label="IVA 10"
                  value={formatMoney(Number(facturaInforme.subtotal?.iva10 || 0))}
                />
                <ResumenInforme
                  label="Total IVA"
                  value={formatMoney(Number(facturaInforme.subtotal?.totalIva || 0))}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 22,
                    fontWeight: 700,
                    marginTop: 12
                  }}
                >
                  <span>Total</span>
                  <span>{formatMoney(Number(facturaInforme.total || 0))}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 32, textAlign: "center", color: "#4b5563" }}>
              Gracias por su compra
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 8,
  borderBottom: "1px solid #d1d5db"
};

const thRightStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: "right"
};

const tdStyle: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #d1d5db"
};

const tdRightStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right"
};

function ResumenInforme({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #e5e7eb"
      }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
