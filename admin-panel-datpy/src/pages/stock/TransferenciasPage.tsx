import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { StockService, type StockTransferencia } from "../../services/StockService";
import { useIsMobile } from "../../hooks/useIsMobile";

const obtenerMensajeError = (error: any, fallback: string) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data.trim() || fallback;

  return data?.message || data?.error || data?.detail || data?.mensaje || error?.message || fallback;
};

const formatCantidad = (value: number) =>
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 4 }).format(value ?? 0);

const formatFechaHora = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-PY", { dateStyle: "short", timeStyle: "short" });
};

const formatFecha = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-PY");
};

const opcionesEstado = [
  { label: "Todas", value: "" },
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Aprobadas", value: "APROBADA" },
  { label: "Rechazadas", value: "RECHAZADA" }
];

const severidadEstado = (estado: string): "warning" | "success" | "danger" => {
  if (estado === "APROBADA") return "success";
  if (estado === "RECHAZADA") return "danger";
  return "warning";
};

export default function TransferenciasPage() {
  const navigate = useNavigate();

  const [transferencias, setTransferencias] = useState<StockTransferencia[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [filtroEstado, setFiltroEstado] = useState("PENDIENTE");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleItem, setDetalleItem] = useState<StockTransferencia | null>(null);

  const isMobile = useIsMobile();

  const cargar = async () => {
    try {
      const res = await StockService.getPaginatedTransferencias(page, size, filtroEstado || undefined);

      setTransferencias(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando transferencias", error);

      setTransferencias([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    cargar();
  }, [page, filtroEstado]);

  const aprobar = async (item: StockTransferencia) => {
    const result = await Swal.fire({
      title: "¿Aprobar transferencia?",
      html: `${item.productoDescripcion}<br/><small>${item.depositoOrigenNombre} → ${item.depositoDestinoNombre} · ${formatCantidad(item.cantidadUnitario)} unid.</small>`,
      icon: "question",
      input: "textarea",
      inputLabel: "Observación (opcional)",
      inputPlaceholder: "Opcional",
      showCancelButton: true,
      confirmButtonText: "Aprobar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      setProcesandoId(item.id);
      await StockService.aprobarTransferencia(item.id, { observacion: result.value || null });
      Swal.fire("Aprobada", "La transferencia se aplicó al stock correctamente", "success");
      cargar();
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error, "No se pudo aprobar la transferencia"), "error");
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazar = async (item: StockTransferencia) => {
    const result = await Swal.fire({
      title: "¿Rechazar transferencia?",
      html: `${item.productoDescripcion}<br/><small>${item.depositoOrigenNombre} → ${item.depositoDestinoNombre} · ${formatCantidad(item.cantidadUnitario)} unid.</small>`,
      icon: "warning",
      input: "textarea",
      inputLabel: "Motivo del rechazo (opcional)",
      inputPlaceholder: "Opcional",
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      confirmButtonColor: "#dc3545",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      setProcesandoId(item.id);
      await StockService.rechazarTransferencia(item.id, { observacion: result.value || null });
      Swal.fire("Rechazada", "La transferencia fue rechazada", "success");
      cargar();
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error, "No se pudo rechazar la transferencia"), "error");
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirDetalle = (item: StockTransferencia) => {
    setDetalleItem(item);
    setDetalleOpen(true);
  };

  const estadoTemplate = (rowData: StockTransferencia) => (
    <Tag value={rowData.estado} severity={severidadEstado(rowData.estado)} />
  );

  const rutaTemplate = (rowData: StockTransferencia) => (
    <span>
      {rowData.depositoOrigenNombre} <i className="pi pi-arrow-right mx-1" style={{ fontSize: "0.75rem" }} /> {rowData.depositoDestinoNombre}
    </span>
  );

  const cantidadTemplate = (rowData: StockTransferencia) =>
    `${formatCantidad(rowData.cantidadUnitario)} unid. / ${formatCantidad(rowData.cantidadCaja)} cajas`;

  const accionesTemplate = (rowData: StockTransferencia) => (
    <div className="flex gap-1 justify-content-center">
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        tooltip="Ver detalle"
        onClick={() => abrirDetalle(rowData)}
      />

      {rowData.estado === "PENDIENTE" && (
        <>
          <Button
            icon="pi pi-check"
            rounded
            text
            severity="success"
            tooltip="Aprobar"
            loading={procesandoId === rowData.id}
            onClick={() => aprobar(rowData)}
          />
          <Button
            icon="pi pi-times"
            rounded
            text
            severity="danger"
            tooltip="Rechazar"
            loading={procesandoId === rowData.id}
            onClick={() => rechazar(rowData)}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Transferencias de Stock</h2>
          <small className="text-color-secondary">Solicitudes de traslado entre depósitos, pendientes de aprobación</small>
        </div>
        <Button label="Volver a Stock" icon="pi pi-arrow-left" severity="secondary" outlined onClick={() => navigate("/stock")} />
      </div>

      <div className="grid mb-3">
        <div className="col-12 md:col-4">
          <Dropdown
            className="w-full"
            value={filtroEstado}
            options={opcionesEstado}
            onChange={(e) => { setPage(0); setFiltroEstado(e.value); }}
          />
        </div>
      </div>

      {isMobile ? (
        <>
          {transferencias.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No hay transferencias registradas</p>
          ) : transferencias.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff" }}>
              <div className="flex justify-content-between align-items-start">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productoDescripcion}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {item.depositoOrigenNombre} → {item.depositoDestinoNombre} · {formatCantidad(item.cantidadUnitario)} unid.
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.motivo}</div>
                </div>
                {estadoTemplate(item)}
              </div>
              <div className="flex justify-content-end mt-2">{accionesTemplate(item)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, alignItems: "center" }}>
            <Button icon="pi pi-angle-left" text size="small" disabled={page === 0} onClick={() => setPage(page - 1)} />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Pág. {page + 1} de {Math.max(1, Math.ceil(total / size))}</span>
            <Button icon="pi pi-angle-right" text size="small" disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} />
          </div>
        </>
      ) : (
        <DataTable
          value={transferencias}
          paginator
          rows={size}
          totalRecords={total}
          lazy
          size="small"
          first={page * size}
          onPage={(e) => setPage(e.page ?? 0)}
          stripedRows
          showGridlines
          scrollable
          scrollHeight="flex"
          emptyMessage="No hay transferencias registradas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} transferencias"
        >
          <Column field="productoDescripcion" header="Producto" />
          <Column header="Depósitos" body={rutaTemplate} style={{ width: "220px" }} />
          <Column header="Cantidad" body={cantidadTemplate} style={{ width: "170px" }} />
          <Column field="motivo" header="Motivo" />
          <Column header="Estado" body={estadoTemplate} style={{ width: "120px" }} />
          <Column field="solicitadoPorNombre" header="Solicitado por" style={{ width: "160px" }} />
          <Column header="Fecha" body={(row: StockTransferencia) => formatFechaHora(row.fechaSolicitud)} style={{ width: "140px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "150px" }} />
        </DataTable>
      )}

      <Dialog
        header="Detalle de la Transferencia"
        visible={detalleOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "520px", maxWidth: "95vw" }}
        onHide={() => setDetalleOpen(false)}
      >
        {detalleItem && (
          <div className="flex flex-column gap-4">
            <div
              className="p-3 border-round-lg"
              style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}
            >
              <div className="flex justify-content-between align-items-start mb-2">
                <div className="text-900" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                  {detalleItem.productoDescripcion}
                </div>
                <Tag value={detalleItem.estado} severity={severidadEstado(detalleItem.estado)} />
              </div>

              <div className="text-700" style={{ fontSize: "1rem" }}>
                {detalleItem.depositoOrigenNombre} <i className="pi pi-arrow-right mx-1" style={{ fontSize: "0.8rem" }} /> {detalleItem.depositoDestinoNombre}
              </div>

              <div className="text-700 mt-1" style={{ fontSize: "1rem" }}>
                {formatCantidad(detalleItem.cantidadUnitario)} unid. / {formatCantidad(detalleItem.cantidadCaja)} cajas
                {detalleItem.lote ? ` · Lote: ${detalleItem.lote}` : ""}
                {detalleItem.vencimiento ? ` · Vto: ${formatFecha(detalleItem.vencimiento)}` : ""}
              </div>
            </div>

            <div>
              <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>Motivo</div>
              <div className="text-900" style={{ fontSize: "1rem" }}>{detalleItem.motivo}</div>
            </div>

            <div className="grid">
              <div className="col-6">
                <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>Solicitado por</div>
                <div className="text-900" style={{ fontSize: "1rem" }}>{detalleItem.solicitadoPorNombre ?? "-"}</div>
              </div>

              <div className="col-6">
                <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>Fecha de solicitud</div>
                <div className="text-900" style={{ fontSize: "1rem" }}>{formatFechaHora(detalleItem.fechaSolicitud)}</div>
              </div>
            </div>

            {detalleItem.estado !== "PENDIENTE" && (
              <div className="grid">
                <div className="col-6">
                  <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>
                    {detalleItem.estado === "APROBADA" ? "Aprobado por" : "Rechazado por"}
                  </div>
                  <div className="text-900" style={{ fontSize: "1rem" }}>{detalleItem.aprobadoPorNombre ?? "-"}</div>
                </div>

                <div className="col-6">
                  <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>Fecha de resolución</div>
                  <div className="text-900" style={{ fontSize: "1rem" }}>{formatFechaHora(detalleItem.fechaResolucion)}</div>
                </div>

                {detalleItem.observacionResolucion && (
                  <div className="col-12">
                    <div className="text-600 font-medium" style={{ fontSize: "0.85rem" }}>Observación</div>
                    <div className="text-900" style={{ fontSize: "1rem" }}>{detalleItem.observacionResolucion}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          {detalleItem?.estado === "PENDIENTE" && (
            <>
              <Button
                label="Rechazar"
                icon="pi pi-times"
                severity="danger"
                outlined
                loading={procesandoId === detalleItem.id}
                onClick={() => { setDetalleOpen(false); rechazar(detalleItem); }}
              />
              <Button
                label="Aprobar"
                icon="pi pi-check"
                severity="success"
                loading={procesandoId === detalleItem.id}
                onClick={() => { setDetalleOpen(false); aprobar(detalleItem); }}
              />
            </>
          )}
          <Button label="Cerrar" severity="secondary" outlined onClick={() => setDetalleOpen(false)} />
        </div>
      </Dialog>
    </div>
  );
}
