import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useIsMobile } from "../../hooks/useIsMobile";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import type { DataTablePageEvent } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";

import type { FacturaListadoFiltros } from "../../services/FacturaService";
import { FacturaService } from "../../services/FacturaService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";
import { descargarBoletaVentaPdf } from "../../comprobantes/invoices";

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
  cdc?: string;
  estadoSifen?: string;
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

  const [loadingInforme, setLoadingInforme] = useState<string | null>(null);
  const [loadingNuevaFactura, setLoadingNuevaFactura] = useState(false);
  const [loadingSifen, setLoadingSifen] = useState<string | null>(null);
  const [loadingXml, setLoadingXml] = useState<string | null>(null);
  const isMobile = useIsMobile();

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

  const nuevaFactura = async () => {
    try {
      setLoadingNuevaFactura(true);
      await CajaAperturaCierreService.getCajaAbierta(1);
      window.location.href = "/facturacion-create";
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
          window.location.href = "/apertura-caja";
        }
      });
    } finally {
      setLoadingNuevaFactura(false);
    }
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

  const copiarCdc = async (cdc: string) => {
    try {
      await navigator.clipboard.writeText(cdc);
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "CDC copiado", showConfirmButton: false, timer: 1200 });
    } catch {
      Swal.fire("Error", "No se pudo copiar el CDC", "error");
    }
  };

  const sifenEstadoBody = (rowData: FacturaListado) => {
    if (!rowData.cdc) {
      return <Tag value="Sin enviar" severity="secondary" />;
    }

    const estado = rowData.estadoSifen || "Pendiente";
    const estadoUpper = estado.toUpperCase();

    const severity =
      estadoUpper === "APROBADO" || estadoUpper === "APROBADO_CON_OBSERVACION"
        ? "success"
        : estadoUpper === "RECHAZADO"
        ? "danger"
        : estadoUpper === "CANCELADO"
        ? "danger"
        : "warning";

    return <Tag value={estado} severity={severity as any} />;
  };

  const cdcBody = (rowData: FacturaListado) => {
    if (!rowData.cdc) return "-";

    return (
      <div className="flex align-items-center gap-2">
        <span style={{ fontFamily: "monospace", whiteSpace: "nowrap" }}>{rowData.cdc}</span>
        <Button
          icon="pi pi-copy"
          text
          rounded
          size="small"
          tooltip="Copiar CDC completo"
          onClick={() => copiarCdc(rowData.cdc!)}
        />
      </div>
    );
  };

  const enviarASifen = async (factura: FacturaListado) => {
    try {
      setLoadingSifen(factura.id);
      const res = await FacturaService.enviarSifen(factura.id);

      Swal.fire({
        icon: res.estado === "RECHAZADO" ? "error" : "success",
        title: "SIFEN",
        html: `<div style="text-align:left"><b>Estado:</b> ${res.estado ?? "-"}<br/><b>CDC:</b> ${res.cdc ?? "-"}<br/><b>Mensaje:</b> ${res.mensajeRespuesta ?? "-"}</div>`
      });

      cargarFacturas();
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo enviar la factura a SIFEN";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setLoadingSifen(null);
    }
  };

  const verXmlSifen = async (factura: FacturaListado) => {
    try {
      setLoadingXml(factura.id);
      const blob = await FacturaService.getXmlSifen(factura.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/xml" }));
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo obtener el XML de la factura", "error");
    } finally {
      setLoadingXml(null);
    }
  };

  const anularFactura = async (factura: FacturaListado) => {
    if (!factura.cdc) {
      Swal.fire("Atención", "Esta factura todavía no fue enviada a SIFEN.", "info");
      return;
    }

    const { value: motivo, isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Cancelar factura en SIFEN",
      text: `¿Desea solicitar la cancelación de la factura ${factura.dEst}-${factura.dPunExp}-${factura.dNumDoc} en SIFEN?`,
      input: "textarea",
      inputLabel: "Motivo de la cancelación",
      inputPlaceholder: "Indique el motivo...",
      inputValidator: (value) => (!value?.trim() ? "El motivo es obligatorio" : undefined),
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#dc2626"
    });

    if (!isConfirmed || !motivo) return;

    try {
      setLoadingSifen(factura.id);
      const res = await FacturaService.cancelarSifen(factura.id, motivo.trim());

      Swal.fire({
        icon: res.estado === "RECHAZADO" ? "error" : "success",
        title: "SIFEN",
        html: `<div style="text-align:left"><b>Estado del evento:</b> ${res.estado ?? "-"}<br/><b>Mensaje:</b> ${res.mensajeRespuesta ?? "-"}</div>`
      });

      cargarFacturas();
    } catch (error: any) {
      console.error(error);
      const mensaje = error?.response?.data?.message ?? "No se pudo cancelar la factura en SIFEN";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setLoadingSifen(null);
    }
  };

  const verInforme = async (factura: FacturaListado) => {
    try {
      setLoadingInforme(factura.id);
      const res = await FacturaService.getById(factura.id);

      const condicionVenta: number = res.condicionOperacionId ?? 1;
      await descargarBoletaVentaPdf({
        puntoExpedicion: `${res.dEst}-${res.dPunExp}`,
        nroDoc: `${res.dEst ?? res.dest}-${res.dPunExp ?? res.dpunExp}-${res.dNumDoc ?? res.dnumDoc ?? "0000001"}`,
        fecha: res.dFeEmiDE ? new Date(res.dFeEmiDE) : new Date(),
        moneda: res.moneda ?? "PYG",
        condicionVenta,
        condicionLabel: condicionVenta === 1 ? "Contado" : "Crédito",
        clienteRazonSocial: res.dNomRec ?? res.clienteRazonSocial ?? "-",
        clienteDocumento: res.dRucRec
          ? `${res.dRucRec}${res.dDVRec ? "-" + res.dDVRec : ""}`
          : (res.clienteDocumento ?? "-"),
        clienteDireccion: res.dDirRec ?? res.clienteDireccion ?? "",
        items: (res.detalles ?? []).map((d: any) => ({
          codigo: d.codigo ?? "",
          descripcion: d.descripcion ?? "",
          cantidad: d.cantidad ?? 0,
          precioUnitario: Number(d.precioUnitario ?? 0),
          exenta: Number(d.exenta ?? 0),
          iva5: Number(d.iva5 ?? 0),
          iva10: Number(d.iva10 ?? 0),
        })),
        pagos: (res.pagos ?? []).map((p: any) => ({
          formaPago: p.formaPago ?? "",
          referencia: p.referencia ?? "",
          monto: Number(p.monto ?? 0),
        })),
        resumen: {
          totalExenta: Number(res.subtotal?.exenta ?? 0),
          subtotalIva5: Number(res.subtotal?.subtotalIva5 ?? 0),
          subtotalIva10: Number(res.subtotal?.subtotalIva10 ?? 0),
          liquidacionIva5: Number(res.subtotal?.iva5 ?? 0),
          liquidacionIva10: Number(res.subtotal?.iva10 ?? 0),
          totalIva: Number(res.subtotal?.totalIva ?? 0),
        },
        totalAbonar: Number(res.total ?? 0),
        vuelto: 0,
        cdc: res.cdc ?? undefined,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo obtener el informe de la factura", "error");
    } finally {
      setLoadingInforme(null);
    }
  };

  const accionesBody = (rowData: FacturaListado) => {
    const yaCancelada = (rowData.estadoSifen || "").toUpperCase() === "CANCELADO";

    return (
      <div className="flex gap-2 justify-content-end">
        <Button
          icon="pi pi-file-pdf"
          severity="info"
          text
          rounded
          tooltip="Ver / Imprimir"
          loading={loadingInforme === rowData.id}
          onClick={() => verInforme(rowData)}
        />

        <Button
          icon="pi pi-send"
          severity="help"
          text
          rounded
          tooltip={rowData.cdc ? "Actualizar estado SIFEN" : "Enviar a SIFEN"}
          loading={loadingSifen === rowData.id}
          onClick={() => enviarASifen(rowData)}
        />

        {rowData.cdc && (
          <Button
            icon="pi pi-code"
            severity="info"
            text
            rounded
            tooltip="Ver XML"
            loading={loadingXml === rowData.id}
            onClick={() => verXmlSifen(rowData)}
          />
        )}

        <Button
          icon="pi pi-ban"
          severity="danger"
          text
          rounded
          tooltip="Anular"
          disabled={yaCancelada}
          onClick={() => anularFactura(rowData)}
        />
      </div>
    );
  };

  return (
    <div>
      <style>{`
        .facturas-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 14px;
          background: #fff;
          margin-bottom: 10px;
        }
        .facturas-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .facturas-card-num {
          font-weight: 700;
          font-size: 13px;
          color: #111827;
        }
        .facturas-card-cliente {
          font-size: 13px;
          color: #374151;
          margin-bottom: 8px;
        }
        .facturas-card-doc {
          font-size: 11px;
          color: #6b7280;
        }
        .facturas-card-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .facturas-card-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          font-size: 12px;
          color: #6b7280;
        }
        .facturas-card-total {
          font-weight: 700;
          font-size: 14px;
          color: #111827;
        }
        .facturas-card-actions {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
          margin-top: 8px;
          border-top: 1px solid #f3f4f6;
          padding-top: 8px;
        }
        .facturas-empty {
          text-align: center;
          padding: 32px 16px;
          color: #9ca3af;
          font-size: 13px;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
        }
        .facturas-mobile-paginator {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .facturas-mobile-paginator span {
          font-size: 13px;
          color: #6b7280;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0" style={{ fontSize: isMobile ? "18px" : undefined }}>Listado de facturas</h2>
          <small className="text-color-secondary">Consulta de facturas emitidas</small>
        </div>
        <Button
          label={isMobile ? undefined : "Nueva factura"}
          icon="pi pi-plus"
          severity="success"
          loading={loadingNuevaFactura}
          onClick={nuevaFactura}
          tooltip={isMobile ? "Nueva factura" : undefined}
          tooltipOptions={{ position: "left" }}
        />
      </div>

      {/* Filtros */}
      <div className="grid mb-3">
        <div className="col-12">
          <label>Buscar</label>
          <InputText
            className="w-full"
            value={search}
            placeholder="Cliente, documento o número"
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
          />
        </div>

        <div className="col-6 md:col-6 lg:col-2">
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

        <div className="col-6 md:col-6 lg:col-2">
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

        <div className="col-6 md:col-6 lg:col-2">
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

        <div className="col-6 md:col-6 lg:col-2">
          <label>RUC cliente</label>
          <InputText
            className="w-full"
            value={rucCliente}
            placeholder="Ej: 80000000-1"
            onChange={(e) => setRucCliente(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
          />
        </div>

        <div className="col-12 md:col-6 lg:col-1 flex align-items-end gap-2">
          <Button icon="pi pi-search" onClick={buscar} loading={loading} tooltip="Buscar" className={isMobile ? "flex-1" : ""} />
          <Button icon="pi pi-filter-slash" severity="secondary" outlined onClick={limpiarFiltros} disabled={loading} tooltip="Limpiar filtros" className={isMobile ? "flex-1" : ""} />
        </div>
      </div>

      {/* Tabla desktop / Cards mobile */}
      {isMobile ? (
        <>
          {loading ? (
            <div className="facturas-empty">Cargando...</div>
          ) : facturas.length === 0 ? (
            <div className="facturas-empty">No hay facturas registradas</div>
          ) : (
            facturas.map((f) => (
              <div key={f.id} className="facturas-card">
                <div className="facturas-card-header">
                  <div>
                    <div className="facturas-card-num">{`${f.dEst}-${f.dPunExp}-${f.dNumDoc}`}</div>
                    <div className="facturas-card-doc">{fechaBody(f)}</div>
                  </div>
                  {estadoBody(f)}
                </div>

                <div className="facturas-card-cliente">
                  {f.clienteRazonSocial}
                  {f.clienteDocumento && (
                    <span className="facturas-card-doc"> · {f.clienteDocumento}</span>
                  )}
                </div>

                <div className="facturas-card-row">
                  {condicionBody(f)}
                  <span className="facturas-card-total">{formatMoney(f.total || 0)}</span>
                </div>

                <div className="facturas-card-row">
                  {sifenEstadoBody(f)}
                  {f.cdc && cdcBody(f)}
                </div>

                <div className="facturas-card-actions">
                  <Button
                    icon="pi pi-file-pdf"
                    label="Ver"
                    severity="info"
                    text
                    size="small"
                    loading={loadingInforme === f.id}
                    onClick={() => verInforme(f)}
                  />
                  <Button
                    icon="pi pi-send"
                    label={f.cdc ? "Actualizar" : "Enviar"}
                    severity="help"
                    text
                    size="small"
                    loading={loadingSifen === f.id}
                    onClick={() => enviarASifen(f)}
                  />
                  {f.cdc && (
                    <Button
                      icon="pi pi-code"
                      label="XML"
                      severity="info"
                      text
                      size="small"
                      loading={loadingXml === f.id}
                      onClick={() => verXmlSifen(f)}
                    />
                  )}
                  <Button
                    icon="pi pi-ban"
                    label="Anular"
                    severity="danger"
                    text
                    size="small"
                    disabled={(f.estadoSifen || "").toUpperCase() === "CANCELADO"}
                    onClick={() => anularFactura(f)}
                  />
                </div>
              </div>
            ))
          )}

          {/* Paginador mobile */}
          <div className="facturas-mobile-paginator">
            <Button icon="pi pi-angle-double-left" text size="small" disabled={page === 0} onClick={() => { setFirst(0); setPage(0); cargarFacturas(0, size, search); }} />
            <Button icon="pi pi-angle-left" text size="small" disabled={page === 0} onClick={() => { const p = page - 1; setFirst(p * size); setPage(p); cargarFacturas(p, size, search); }} />
            <span>Página {page + 1} de {Math.max(1, Math.ceil(totalRecords / size))}</span>
            <Button icon="pi pi-angle-right" text size="small" disabled={(page + 1) * size >= totalRecords} onClick={() => { const p = page + 1; setFirst(p * size); setPage(p); cargarFacturas(p, size, search); }} />
            <Button icon="pi pi-angle-double-right" text size="small" disabled={(page + 1) * size >= totalRecords} onClick={() => { const last = Math.ceil(totalRecords / size) - 1; setFirst(last * size); setPage(last); cargarFacturas(last, size, search); }} />
          </div>
        </>
      ) : (
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
          scrollable
          emptyMessage="No hay facturas registradas"
        >
          <Column header="Numeración" body={numeracionBody} />
          <Column header="Fecha" body={fechaBody} />
          <Column field="clienteRazonSocial" header="Cliente" />
          <Column field="clienteDocumento" header="Documento" />
          <Column header="Condición de Venta" body={condicionBody} />
          <Column header="Total" body={totalBody} />
          <Column header="Estado" body={estadoBody} />
          <Column header="Estado SIFEN" body={sifenEstadoBody} />
          <Column header="CDC" body={cdcBody} />
          <Column header="Acciones" body={accionesBody} style={{ width: "160px" }} />
        </DataTable>
      )}
    </div>
  );
}

