import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";

import { useAuth } from "../../context/AuthContext";
import type { CajaAperturaCierreFiltros } from "../../services/CajaAperturaCierreService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";

interface CajaAperturaCierre {
  id: string;
  fechaApertura: string;
  fechaCierre?: string | null;
  montoApertura: number;
  montoCierre?: number | null;
  nroCaja: number;
  estado: string;
  totalVenta?: number | null;
  totalGastos?: number | null;
  usuarioAperturaNombre?: string;
  usuarioCierreNombre?: string;
}

interface CajaMovimiento {
  id: string;
  monto: number;
  tipoPago: string;
  fecha: string;
  hora: string;
  estado: string;
  observacion?: string | null;
  observacionAdicional?: string | null;
  tipoMovimiento: string;
  codigoMoneda?: string | null;
}

interface AperturaCajaForm {
  fechaApertura: Date;
  montoApertura: string;
  nroCaja: number;
}

const estadosCaja = [
  { label: "Activos", value: "ABIERTA" },
  { label: "Cerrados", value: "CERRADA" },
  { label: "Anulados", value: "ANULADA" }
];

const getFechaActual = () => {
  const fechaActual = new Date();
  fechaActual.setHours(0, 0, 0, 0);

  return fechaActual;
};

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getUsuarioId = (user: any) => {
  return user?.id ?? user?.userId ?? user?.usuarioId ?? null;
};

const parseMonto = (value: string) => {
  return Number(value.replace(/\D/g, "") || 0);
};

const obtenerMensajeError = (error: any, fallback: string) => {
  const data = error?.response?.data;

  if (typeof data === "string") {
    return data.trim() || fallback;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((item: any) => item?.message || item?.defaultMessage || String(item))
      .join("\n");
  }

  const mensaje =
    data?.message ||
    data?.error ||
    data?.detail ||
    data?.mensaje ||
    data?.title ||
    error?.message;

  if (typeof mensaje === "string" && mensaje.trim()) {
    return mensaje;
  }

  if (data && typeof data === "object") {
    return JSON.stringify(data);
  }

  return fallback;
};

export default function AperturaCajaPage() {
  const { user } = useAuth();

  const [cajas, setCajas] = useState<CajaAperturaCierre[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState<Date | null>(() => getFechaActual());
  const [fechaHasta, setFechaHasta] = useState<Date | null>(() => getFechaActual());
  const [estadoFiltro, setEstadoFiltro] = useState<string | null>(null);

  const [first, setFirst] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [cajaDetalle, setCajaDetalle] = useState<CajaAperturaCierre | null>(null);
  const [movimientosDetalle, setMovimientosDetalle] = useState<CajaMovimiento[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const [form, setForm] = useState<AperturaCajaForm>({
    fechaApertura: getFechaActual(),
    montoApertura: "",
    nroCaja: 1
  });

  const obtenerFiltros = (): CajaAperturaCierreFiltros => ({
    fechaDesde: fechaDesde ? formatDateParam(fechaDesde) : "",
    fechaHasta: fechaHasta ? formatDateParam(fechaHasta) : "",
    estado: estadoFiltro ?? ""
  });

  const cargarCajas = async (
    pageValue = page,
    sizeValue = size,
    searchValue = search,
    filtrosValue = obtenerFiltros()
  ) => {
    try {
      setLoading(true);

      const res = await CajaAperturaCierreService.getPaginated(
        pageValue,
        sizeValue,
        searchValue,
        filtrosValue
      );

      setCajas(res?.content ?? []);
      setTotalRecords(res?.totalElements ?? 0);
    } catch (error) {
      console.error(error);
      setCajas([]);
      setTotalRecords(0);
      Swal.fire("Error", "No se pudo cargar el listado de cajas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCajas(0, size, "");
  }, []);

  const buscar = () => {
    setFirst(0);
    setPage(0);
    cargarCajas(0, size, search);
  };

  const limpiarFiltros = () => {
    const fechaActualDesde = getFechaActual();
    const fechaActualHasta = getFechaActual();
    const filtrosLimpios = {
      fechaDesde: formatDateParam(fechaActualDesde),
      fechaHasta: formatDateParam(fechaActualHasta),
      estado: ""
    };

    setSearch("");
    setFechaDesde(fechaActualDesde);
    setFechaHasta(fechaActualHasta);
    setEstadoFiltro(null);
    setFirst(0);
    setPage(0);
    cargarCajas(0, size, "", filtrosLimpios);
  };

  const onPage = (event: DataTablePageEvent) => {
    const nextPage = event.page ?? 0;
    const nextSize = event.rows;

    setFirst(event.first);
    setPage(nextPage);
    setSize(nextSize);

    cargarCajas(nextPage, nextSize, search);
  };

  const limpiarFormulario = () => {
    setForm({
      fechaApertura: getFechaActual(),
      montoApertura: "",
      nroCaja: 1
    });
  };

  const guardarApertura = async () => {
    if (!form.fechaApertura) {
      Swal.fire("Atención", "La fecha de apertura es obligatoria", "warning");
      return;
    }

    if (!form.nroCaja || form.nroCaja <= 0) {
      Swal.fire("Atención", "El número de caja debe ser mayor a cero", "warning");
      return;
    }

    const montoApertura = parseMonto(form.montoApertura);

    if (montoApertura < 0) {
      Swal.fire("Atención", "El monto de apertura no puede ser negativo", "warning");
      return;
    }

    try {
      setGuardando(true);

      await CajaAperturaCierreService.create({
        empresaId: localStorage.getItem("empresaId"),
        fechaApertura: formatDateParam(form.fechaApertura),
        montoApertura,
        nroCaja: form.nroCaja,
        estado: "ABIERTA",
        usuarioAperturaId: getUsuarioId(user)
      });

      Swal.fire("Creado", "Caja abierta correctamente", "success");
      limpiarFormulario();
      setFirst(0);
      setPage(0);
      cargarCajas(0, size, search);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudo abrir la caja"),
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const formatMoney = (value?: number | null) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";

    return new Date(`${value}T00:00:00`).toLocaleDateString("es-PY");
  };

  const estadoBody = (rowData: CajaAperturaCierre) => {
    const estado = rowData.estado || "-";
    const estadoLower = estado.toLowerCase();
    const severity =
      estadoLower === "abierta"
        ? "success"
        : estadoLower === "anulada"
        ? "danger"
        : "secondary";

    return <Tag value={estado} severity={severity as any} />;
  };

  const estadoMovimientoBody = (rowData: CajaMovimiento) => {
    const estado = rowData.estado || "-";
    const estadoLower = estado.toLowerCase();
    const severity =
      estadoLower === "activo"
        ? "success"
        : estadoLower === "anulado"
        ? "danger"
        : "secondary";

    return <Tag value={estado} severity={severity as any} />;
  };

  const tipoMovimientoBody = (rowData: CajaMovimiento) => {
    const tipoMovimiento = rowData.tipoMovimiento || "-";
    const tipoLower = tipoMovimiento.toLowerCase();
    const esIngreso = tipoLower === "ingreso";
    const esEgreso = tipoLower === "egreso";

    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "999px",
          border: esIngreso
            ? "1px solid #7dd3fc"
            : esEgreso
            ? "1px solid #fdba74"
            : "1px solid #d1d5db",
          background: esIngreso ? "#f0f9ff" : esEgreso ? "#fff7ed" : "#f9fafb",
          color: esIngreso ? "#0369a1" : esEgreso ? "#c2410c" : "#374151",
          fontWeight: 600,
          fontSize: "0.85rem"
        }}
      >
        {tipoMovimiento}
      </span>
    );
  };

  const verDetalles = async (caja: CajaAperturaCierre) => {
    try {
      setCajaDetalle(caja);
      setMovimientosDetalle([]);
      setDetalleVisible(true);
      setLoadingDetalle(true);

      const res = await CajaAperturaCierreService.getMovimientos(caja.id);
      setMovimientosDetalle(res?.content ?? res ?? []);
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudo cargar el detalle de la caja"),
        "error"
      );
    } finally {
      setLoadingDetalle(false);
    }
  };

  const imprimirDetallePdf = () => {
    if (!cajaDetalle) return;

    const filas = movimientosDetalle
      .map(
        (item) => `
          <tr>
            <td>${formatDate(item.fecha)}</td>
            <td>${item.hora || "-"}</td>
            <td>${item.tipoMovimiento || "-"}</td>
            <td>${item.tipoPago || "-"}</td>
            <td>${item.estado || "-"}</td>
            <td style="text-align:right;">${formatMoney(item.monto)}</td>
            <td>${item.observacion || "-"}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Detalle caja ${cajaDetalle.nroCaja}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; padding: 24px; }
            h2, h3 { margin: 0 0 8px; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 32px; margin: 16px 0 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border-bottom: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h2>Detalle de caja ${cajaDetalle.nroCaja}</h2>
          <div class="summary">
            <div><strong>Estado:</strong> ${cajaDetalle.estado || "-"}</div>
            <div><strong>Fecha apertura:</strong> ${formatDate(cajaDetalle.fechaApertura)}</div>
            <div><strong>Monto apertura:</strong> ${formatMoney(cajaDetalle.montoApertura)}</div>
            <div><strong>Total venta:</strong> ${formatMoney(cajaDetalle.totalVenta)}</div>
            <div><strong>Total gastos:</strong> ${formatMoney(cajaDetalle.totalGastos)}</div>
            <div><strong>Monto cierre:</strong> ${formatMoney(cajaDetalle.montoCierre)}</div>
            <div><strong>Usuario apertura:</strong> ${cajaDetalle.usuarioAperturaNombre || "-"}</div>
            <div><strong>Usuario cierre:</strong> ${cajaDetalle.usuarioCierreNombre || "-"}</div>
          </div>
          <h3>Movimientos</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Movimiento</th>
                <th>Pago</th>
                <th>Estado</th>
                <th style="text-align:right;">Monto</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              ${filas || '<tr><td colspan="7">Sin movimientos</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const anularCaja = async (caja: CajaAperturaCierre) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Anular caja",
      text: `¿Desea anular la caja ${caja.nroCaja}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });

    if (!result.isConfirmed) return;

    Swal.fire("Atención", "Todavía falta crear el endpoint de anulación.", "info");
  };

  const cerrarCaja = async (caja: CajaAperturaCierre) => {
    const result = await Swal.fire({
      icon: "question",
      title: "Cerrar caja",
      text: `¿Desea cerrar la caja ${caja.nroCaja}?`,
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    Swal.fire("Atención", "Todavía falta crear el endpoint de cierre.", "info");
  };

  const accionesBody = (rowData: CajaAperturaCierre) => {
    const cajaAbierta = rowData.estado?.toLowerCase() === "abierta";

    return (
      <div className="flex gap-2 justify-content-end">
        <Button
          icon="pi pi-eye"
          severity="info"
          text
          rounded
          tooltip="Ver detalles"
          onClick={() => verDetalles(rowData)}
        />

        <Button
          icon="pi pi-ban"
          severity="danger"
          text
          rounded
          tooltip="Anular"
          disabled={!cajaAbierta}
          onClick={() => anularCaja(rowData)}
        />

        <Button
          icon="pi pi-lock"
          severity="warning"
          text
          rounded
          tooltip="Cerrar caja"
          disabled={!cajaAbierta}
          onClick={() => cerrarCaja(rowData)}
        />
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="m-0">Apertura de caja</h2>
          <small className="text-color-secondary">
            Registro de apertura y consulta de movimientos de caja
          </small>
        </div>
      </div>

      <div
        className="mb-4"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          background: "#ffffff"
        }}
      >
        <div className="grid align-items-end">
          <div className="col-12 md:col-4 lg:col-3">
            <label>Fecha apertura</label>
            <Calendar
              className="w-full"
              inputClassName="w-full"
              value={form.fechaApertura}
              dateFormat="dd/mm/yy"
              showIcon
              onChange={(e) =>
                setForm({
                  ...form,
                  fechaApertura: e.value ?? getFechaActual()
                })
              }
            />
          </div>

          <div className="col-12 md:col-4 lg:col-2">
            <label>Nro. caja</label>
            <InputNumber
              className="w-full"
              inputClassName="w-full"
              value={form.nroCaja}
              min={1}
              useGrouping={false}
              onValueChange={(e) =>
                setForm({
                  ...form,
                  nroCaja: Number(e.value ?? 1)
                })
              }
            />
          </div>

          <div className="col-12 md:col-4 lg:col-3">
            <label>Monto apertura</label>
            <InputText
              className="w-full"
              value={form.montoApertura}
              placeholder="0"
              inputMode="numeric"
              onChange={(e) =>
                setForm({
                  ...form,
                  montoApertura: e.target.value.replace(/\D/g, "")
                })
              }
            />
          </div>

          <div className="col-12 lg:col-4 flex gap-2">
            <Button
              label="Abrir caja"
              icon="pi pi-play-circle"
              severity="success"
              loading={guardando}
              onClick={guardarApertura}
            />
            <Button
              label="Limpiar"
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              disabled={guardando}
              onClick={limpiarFormulario}
            />
          </div>
        </div>
      </div>

      <div className="grid mb-3">
        <div className="col-12 md:col-6 lg:col-3">
          <label>Buscar</label>
          <InputText
            className="w-full"
            value={search}
            placeholder="Estado o caja"
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
          <label>Estado</label>
          <Dropdown
            className="w-full"
            value={estadoFiltro}
            options={estadosCaja}
            placeholder="Todos"
            showClear
            onChange={(e) => setEstadoFiltro(e.value)}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-3 flex align-items-end gap-2">
          <Button
            icon="pi pi-search"
            label="Buscar"
            loading={loading}
            onClick={buscar}
          />

          <Button
            icon="pi pi-filter-slash"
            label="Limpiar"
            severity="secondary"
            outlined
            disabled={loading}
            onClick={limpiarFiltros}
          />
        </div>
      </div>

      <DataTable
        value={cajas}
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
        emptyMessage="No hay aperturas de caja registradas"
      >
        <Column field="nroCaja" header="Nro. caja" style={{ width: "110px" }} />
        <Column
          header="Fecha apertura"
          body={(rowData: CajaAperturaCierre) => formatDate(rowData.fechaApertura)}
        />
        <Column
          header="Monto apertura"
          body={(rowData: CajaAperturaCierre) => formatMoney(rowData.montoApertura)}
        />
        <Column
          header="Total venta"
          body={(rowData: CajaAperturaCierre) => formatMoney(rowData.totalVenta)}
        />
        <Column
          header="Total gastos"
          body={(rowData: CajaAperturaCierre) => formatMoney(rowData.totalGastos)}
        />
        <Column
          header="Fecha cierre"
          body={(rowData: CajaAperturaCierre) => formatDate(rowData.fechaCierre)}
        />
        <Column
          header="Monto cierre"
          body={(rowData: CajaAperturaCierre) => formatMoney(rowData.montoCierre)}
        />
        <Column header="Estado" body={estadoBody} style={{ width: "120px" }} />
        <Column
          header="Acciones"
          body={accionesBody}
          style={{ width: "160px" }}
        />
      </DataTable>

      <Dialog
        header={cajaDetalle ? `Detalle de caja ${cajaDetalle.nroCaja}` : "Detalle de caja"}
        visible={detalleVisible}
        modal
        style={{ width: "1100px", maxWidth: "98vw" }}
        onHide={() => setDetalleVisible(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cerrar"
              icon="pi pi-times"
              severity="secondary"
              outlined
              onClick={() => setDetalleVisible(false)}
            />
            <Button
              label="PDF"
              icon="pi pi-file-pdf"
              onClick={imprimirDetallePdf}
              disabled={!cajaDetalle}
            />
          </div>
        }
      >
        {cajaDetalle && (
          <div className="grid mb-3">
            <div className="col-12 md:col-3">
              <strong>Estado:</strong>{" "}
              {estadoBody(cajaDetalle)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Fecha apertura:</strong> {formatDate(cajaDetalle.fechaApertura)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Monto apertura:</strong> {formatMoney(cajaDetalle.montoApertura)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Total venta:</strong> {formatMoney(cajaDetalle.totalVenta)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Total gastos:</strong> {formatMoney(cajaDetalle.totalGastos)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Fecha cierre:</strong> {formatDate(cajaDetalle.fechaCierre)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Monto cierre:</strong> {formatMoney(cajaDetalle.montoCierre)}
            </div>
            <div className="col-12 md:col-3">
              <strong>Usuario apertura:</strong> {cajaDetalle.usuarioAperturaNombre || "-"}
            </div>
            <div className="col-12 md:col-3">
              <strong>Usuario cierre:</strong> {cajaDetalle.usuarioCierreNombre || "-"}
            </div>
          </div>
        )}

        <DataTable
          value={movimientosDetalle}
          loading={loadingDetalle}
          dataKey="id"
          size="small"
          stripedRows
          emptyMessage="No hay movimientos para esta caja"
        >
          <Column header="Fecha" body={(rowData: CajaMovimiento) => formatDate(rowData.fecha)} />
          <Column field="hora" header="Hora" />
          <Column header="Movimiento" body={tipoMovimientoBody} />
          <Column field="tipoPago" header="Pago" />
          <Column header="Estado" body={estadoMovimientoBody} />
          <Column header="Monto" body={(rowData: CajaMovimiento) => formatMoney(rowData.monto)} />
          <Column field="observacion" header="Observación" />
        </DataTable>
      </Dialog>
    </div>
  );
}
