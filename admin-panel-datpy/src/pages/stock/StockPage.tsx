import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";

import { StockService, type StockItem, type StockIngresoLoteItem } from "../../services/StockService";
import { DepositoService, type Deposito } from "../../services/DepositoService";
import { ProductosService } from "../../services/ProductosService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface Producto {
  id: string;
  descripcion: string;
}

const formatFecha = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCantidad = (value: number) =>
  new Intl.NumberFormat("es-PY", { maximumFractionDigits: 4 }).format(value ?? 0);

const formatFechaDisplay = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-PY");
};

const DIAS_POR_VENCER = 30;

interface EstadoVencimiento {
  label: string;
  severity: "danger" | "warning";
}

const calcularEstadoVencimiento = (vencimiento: string | null): EstadoVencimiento | null => {
  if (!vencimiento) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaVencimiento = new Date(vencimiento);
  fechaVencimiento.setHours(0, 0, 0, 0);

  const dias = Math.round((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (dias < 0) {
    return { label: `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? "" : "s"}`, severity: "danger" };
  }

  if (dias === 0) {
    return { label: "Vence hoy", severity: "danger" };
  }

  if (dias <= DIAS_POR_VENCER) {
    return { label: `Vence en ${dias} día${dias === 1 ? "" : "s"}`, severity: "warning" };
  }

  return null;
};

const vencimientoMinimo = () => {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + 1);
  return fecha;
};

interface FilaIngreso {
  id: string;
  productoId: string;
  productoDescripcion: string;
  depositoId: string;
  depositoNombre: string;
  cantidadUnitario: number;
  cantidadCaja: number;
  vencimiento: Date | null;
  lote: string;
}

const nuevoIdTemporal = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const obtenerMensajeError = (error: any, fallback: string) => {
  const data = error?.response?.data;

  if (typeof data === "string") return data.trim() || fallback;

  return data?.message || data?.error || data?.detail || data?.mensaje || error?.message || fallback;
};

export default function StockPage() {
  const navigate = useNavigate();

  const [stock, setStock] = useState<StockItem[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [depositos, setDepositos] = useState<Deposito[]>([]);

  const [filtroProductoId, setFiltroProductoId] = useState<string | null>(null);
  const [filtroDepositoId, setFiltroDepositoId] = useState<string | null>(null);

  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [loteFilas, setLoteFilas] = useState<FilaIngreso[]>([]);
  const [registrandoLote, setRegistrandoLote] = useState(false);

  const [filaProductoId, setFilaProductoId] = useState<string | null>(null);
  const [filaDepositoId, setFilaDepositoId] = useState<string | null>(null);
  const [filaCantidadUnitario, setFilaCantidadUnitario] = useState<number | null>(null);
  const [filaCantidadCaja, setFilaCantidadCaja] = useState<number | null>(null);
  const [filaVencimiento, setFilaVencimiento] = useState<Date | null>(null);
  const [filaLote, setFilaLote] = useState("");

  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteItem, setAjusteItem] = useState<StockItem | null>(null);
  const [ajusteUnitario, setAjusteUnitario] = useState<number | null>(null);
  const [ajusteCaja, setAjusteCaja] = useState<number | null>(null);

  const [transferenciaOpen, setTransferenciaOpen] = useState(false);
  const [transferenciaItem, setTransferenciaItem] = useState<StockItem | null>(null);
  const [transferenciaDepositoDestinoId, setTransferenciaDepositoDestinoId] = useState<string | null>(null);
  const [transferenciaUnitario, setTransferenciaUnitario] = useState<number | null>(null);
  const [transferenciaCaja, setTransferenciaCaja] = useState<number | null>(null);
  const [transferenciaMotivo, setTransferenciaMotivo] = useState("");
  const [transfiriendo, setTransfiriendo] = useState(false);

  const isMobile = useIsMobile();

  const cargarStock = async () => {
    try {
      const res = await StockService.getPaginated(
        page,
        size,
        filtroProductoId ?? undefined,
        filtroDepositoId ?? undefined
      );

      setStock(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando Stock", error);

      setStock([]);
      setTotal(0);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [productosRes, depositosRes] = await Promise.all([
        ProductosService.getPaginated(0, 1000, ""),
        DepositoService.getActivos()
      ]);

      setProductos(productosRes?.content ?? []);
      setDepositos(depositosRes ?? []);
    } catch (error) {
      console.error("Error cargando catálogos de Stock", error);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    cargarStock();
  }, [page, filtroProductoId, filtroDepositoId]);

  const abrirIngreso = () => {
    if (depositos.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No hay depósitos activos",
        text: "Cree un depósito antes de cargar stock",
        confirmButtonText: "Ir a Depósitos"
      });
      return;
    }

    setLoteFilas([]);
    setFilaProductoId(null);
    setFilaDepositoId(depositos.length === 1 ? depositos[0].id : null);
    setFilaCantidadUnitario(null);
    setFilaCantidadCaja(null);
    setFilaVencimiento(null);
    setFilaLote("");
    setIngresoOpen(true);
  };

  const mismoVencimiento = (a: Date | null, b: Date | null) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return formatFecha(a) === formatFecha(b);
  };

  const agregarFila = () => {
    if (!filaProductoId || !filaDepositoId || !filaCantidadUnitario) {
      Swal.fire("Atención", "Seleccione producto, depósito e ingrese la cantidad unitaria", "warning");
      return;
    }

    if (filaVencimiento) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const vencimiento = new Date(filaVencimiento);
      vencimiento.setHours(0, 0, 0, 0);

      if (vencimiento.getTime() <= hoy.getTime()) {
        Swal.fire("Atención", "La fecha de vencimiento debe ser posterior a hoy", "warning");
        return;
      }
    }

    const producto = productos.find((item) => item.id === filaProductoId);
    const deposito = depositos.find((item) => item.id === filaDepositoId);
    if (!producto || !deposito) return;

    const loteTrim = filaLote.trim();

    setLoteFilas((prev) => {
      const existente = prev.find(
        (fila) =>
          fila.productoId === filaProductoId &&
          fila.depositoId === filaDepositoId &&
          fila.lote === loteTrim &&
          mismoVencimiento(fila.vencimiento, filaVencimiento)
      );

      if (existente) {
        return prev.map((fila) =>
          fila.id === existente.id
            ? {
                ...fila,
                cantidadUnitario: fila.cantidadUnitario + filaCantidadUnitario,
                cantidadCaja: fila.cantidadCaja + (filaCantidadCaja ?? 0)
              }
            : fila
        );
      }

      return [
        ...prev,
        {
          id: nuevoIdTemporal(),
          productoId: producto.id,
          productoDescripcion: producto.descripcion,
          depositoId: deposito.id,
          depositoNombre: deposito.nombre,
          cantidadUnitario: filaCantidadUnitario,
          cantidadCaja: filaCantidadCaja ?? 0,
          vencimiento: filaVencimiento,
          lote: loteTrim
        }
      ];
    });

    setFilaProductoId(null);
    setFilaCantidadUnitario(null);
    setFilaCantidadCaja(null);
    setFilaVencimiento(null);
    setFilaLote("");
  };

  const quitarFila = (id: string) => {
    setLoteFilas((prev) => prev.filter((fila) => fila.id !== id));
  };

  const registrarLote = async () => {
    if (loteFilas.length === 0) {
      Swal.fire("Atención", "Agregue al menos un producto a la carga", "warning");
      return;
    }

    const items: StockIngresoLoteItem[] = loteFilas.map((fila) => ({
      productoId: fila.productoId,
      depositoId: fila.depositoId,
      cantidadUnitario: fila.cantidadUnitario,
      cantidadCaja: fila.cantidadCaja,
      vencimiento: fila.vencimiento ? formatFecha(fila.vencimiento) : null,
      lote: fila.lote || null
    }));

    try {
      setRegistrandoLote(true);

      await StockService.registrarIngresoLote({ items });

      Swal.fire("Registrado", `Se cargó el stock de ${items.length} producto(s) correctamente`, "success");

      setIngresoOpen(false);
      cargarStock();
    } catch (error) {
      Swal.fire("Error", "No se pudo registrar la carga de stock", "error");
    } finally {
      setRegistrandoLote(false);
    }
  };

  const abrirAjuste = (item: StockItem) => {
    setAjusteItem(item);
    setAjusteUnitario(item.stockActualUnitario);
    setAjusteCaja(item.stockActualCaja);
    setAjusteOpen(true);
  };

  const guardarAjuste = async () => {
    if (!ajusteItem) return;

    try {
      await StockService.ajustar(ajusteItem.id, {
        stockActualUnitario: ajusteUnitario ?? 0,
        stockActualCaja: ajusteCaja ?? 0
      });

      Swal.fire("Actualizado", "Stock ajustado correctamente", "success");

      setAjusteOpen(false);
      cargarStock();
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error, "No se pudo ajustar el stock"), "error");
    }
  };

  const eliminarStock = async (item: StockItem) => {
    const result = await Swal.fire({
      title: "¿Eliminar registro de stock?",
      html: `${item.productoDescripcion}<br/><small>${item.depositoNombre}${item.lote ? ` · Lote: ${item.lote}` : ""}</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await StockService.remove(item.id);
      Swal.fire("Eliminado", "Registro de stock eliminado correctamente", "success");
      cargarStock();
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error, "No se pudo eliminar el registro de stock"), "error");
    }
  };

  const abrirTransferencia = async (item: StockItem) => {
    let depositosActivos = depositos;

    try {
      depositosActivos = await DepositoService.getActivos();
      setDepositos(depositosActivos);
    } catch (error) {
      console.error("Error cargando depósitos activos", error);
    }

    if ((depositosActivos ?? []).filter((d) => d.id !== item.depositoId).length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No hay otro depósito disponible",
        text: "Cree al menos un segundo depósito para poder transferir stock"
      });
      return;
    }

    setTransferenciaItem(item);
    setTransferenciaDepositoDestinoId(null);
    setTransferenciaUnitario(null);
    setTransferenciaCaja(null);
    setTransferenciaMotivo("");
    setTransferenciaOpen(true);
  };

  const guardarTransferencia = async () => {
    if (!transferenciaItem) return;

    if (!transferenciaDepositoDestinoId) {
      Swal.fire("Atención", "Seleccione el depósito de destino", "warning");
      return;
    }

    if (!transferenciaUnitario && !transferenciaCaja) {
      Swal.fire("Atención", "Indique la cantidad a transferir", "warning");
      return;
    }

    if (!transferenciaMotivo.trim()) {
      Swal.fire("Atención", "Indique el motivo de la transferencia", "warning");
      return;
    }

    try {
      setTransfiriendo(true);

      await StockService.transferir(transferenciaItem.id, {
        depositoDestinoId: transferenciaDepositoDestinoId,
        cantidadUnitario: transferenciaUnitario ?? 0,
        cantidadCaja: transferenciaCaja ?? 0,
        motivo: transferenciaMotivo.trim()
      });

      Swal.fire(
        "Solicitud enviada",
        "La transferencia quedó pendiente de aprobación",
        "success"
      );

      setTransferenciaOpen(false);
      cargarStock();
    } catch (error) {
      Swal.fire("Error", obtenerMensajeError(error, "No se pudo solicitar la transferencia"), "error");
    } finally {
      setTransfiriendo(false);
    }
  };

  const stockTemplate = (rowData: StockItem) => {
    const negativo = rowData.stockActualUnitario < 0;

    return (
      <span className={negativo ? "text-red-600 font-semibold" : ""}>
        {formatCantidad(rowData.stockActualUnitario)}
      </span>
    );
  };

  const vencimientoTemplate = (rowData: StockItem) => {
    const estado = calcularEstadoVencimiento(rowData.vencimiento);

    return (
      <div className="flex flex-column gap-1 align-items-start">
        <span>{formatFechaDisplay(rowData.vencimiento)}</span>
        {estado && (
          <Tag value={estado.label} severity={estado.severity} style={{ fontSize: "0.7rem" }} />
        )}
      </div>
    );
  };

  const filaClassName = (rowData: StockItem) => {
    const estado = calcularEstadoVencimiento(rowData.vencimiento);
    if (!estado) return "";
    return estado.severity === "danger" ? "bg-red-50" : "bg-orange-50";
  };

  const accionesTemplate = (rowData: StockItem) => (
    <div className="flex gap-1 justify-content-center">
      <Button icon="pi pi-pencil" rounded text severity="warning" tooltip="Ajustar" onClick={() => abrirAjuste(rowData)} />
      <Button icon="pi pi-arrow-right-arrow-left" rounded text severity="info" tooltip="Solicitar transferencia" onClick={() => abrirTransferencia(rowData)} />
      <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" onClick={() => eliminarStock(rowData)} />
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Stock</h2>
          <small className="text-color-secondary">Existencias por producto y depósito</small>
        </div>
        <div className="flex gap-2">
          <Button label="Transferencias" icon="pi pi-arrow-right-arrow-left" severity="secondary" outlined onClick={() => navigate("/stock/transferencias")} />
          <Button label="Nuevo Ingreso" icon="pi pi-plus" severity="success" onClick={abrirIngreso} />
        </div>
      </div>

      <div className="grid mb-3">
        <div className="col-12 md:col-6">
          <Dropdown
            className="w-full"
            value={filtroProductoId}
            options={productos}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Filtrar por producto"
            filter
            showClear
            onChange={(e) => { setPage(0); setFiltroProductoId(e.value); }}
          />
        </div>

        <div className="col-12 md:col-6">
          <Dropdown
            className="w-full"
            value={filtroDepositoId}
            options={depositos}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Filtrar por depósito"
            showClear
            onChange={(e) => { setPage(0); setFiltroDepositoId(e.value); }}
          />
        </div>
      </div>

      {isMobile ? (
        <>
          {stock.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No hay registros de stock</p>
          ) : stock.map((item) => {
            const estadoVto = calcularEstadoVencimiento(item.vencimiento);

            return (
              <div
                key={item.id}
                className={estadoVto ? (estadoVto.severity === "danger" ? "bg-red-50" : "bg-orange-50") : ""}
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: estadoVto ? undefined : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productoDescripcion}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {item.depositoNombre} · Unid: {formatCantidad(item.stockActualUnitario)} · Vto: {formatFechaDisplay(item.vencimiento)}
                    {item.lote ? ` · Lote: ${item.lote}` : ""}
                  </div>
                  {estadoVto && (
                    <Tag value={estadoVto.label} severity={estadoVto.severity} style={{ fontSize: "0.7rem", marginTop: 4 }} />
                  )}
                </div>
                {accionesTemplate(item)}
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, alignItems: "center" }}>
            <Button icon="pi pi-angle-left" text size="small" disabled={page === 0} onClick={() => setPage(page - 1)} />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Pág. {page + 1} de {Math.max(1, Math.ceil(total / size))}</span>
            <Button icon="pi pi-angle-right" text size="small" disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} />
          </div>
        </>
      ) : (
        <DataTable
          value={stock}
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
          rowClassName={filaClassName}
          emptyMessage="No hay registros de stock"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        >
          <Column field="productoDescripcion" header="Producto" sortable />
          <Column field="depositoNombre" header="Depósito" sortable />
          <Column header="Stock Unitario" body={stockTemplate} style={{ width: "150px" }} />
          <Column field="stockActualCaja" header="Stock Caja" body={(row: StockItem) => formatCantidad(row.stockActualCaja)} style={{ width: "130px" }} />
          <Column header="Vencimiento" body={vencimientoTemplate} style={{ width: "160px" }} />
          <Column field="lote" header="Lote" body={(row: StockItem) => row.lote || "-"} style={{ width: "120px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "150px" }} />
        </DataTable>
      )}

      <Dialog
        header="Nuevo Ingreso de Stock"
        visible={ingresoOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "920px", maxWidth: "95vw" }}
        contentStyle={{ paddingTop: "0.5rem" }}
        onHide={() => setIngresoOpen(false)}
      >
        <div className="mb-2">
          <span className="font-medium text-900">Agregar productos</span>
          <div>
            <small className="text-color-secondary">
              Un mismo producto puede cargarse en distintos depósitos y con distintos vencimientos dentro de la misma carga
            </small>
          </div>
        </div>

        <div
          className="p-3 border-round-lg mb-4"
          style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}
        >
          <div className="grid align-items-end">
            <div className="col-12 md:col-6">
              <label className="block font-medium mb-2">Producto</label>
              <Dropdown
                className="w-full"
                value={filaProductoId}
                options={productos}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione producto"
                filter
                filterBy="descripcion"
                onChange={(e) => setFilaProductoId(e.value)}
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block font-medium mb-2">Depósito</label>
              <Dropdown
                className="w-full"
                value={filaDepositoId}
                options={depositos}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione depósito"
                onChange={(e) => setFilaDepositoId(e.value)}
              />
            </div>

            <div className="col-6 md:col-2">
              <label className="block font-medium mb-2">Cant. Unitario</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={filaCantidadUnitario}
                minFractionDigits={0}
                maxFractionDigits={4}
                onValueChange={(e) => setFilaCantidadUnitario(e.value ?? null)}
              />
            </div>

            <div className="col-6 md:col-2">
              <label className="block font-medium mb-2">Cant. Caja</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={filaCantidadCaja}
                minFractionDigits={0}
                maxFractionDigits={4}
                onValueChange={(e) => setFilaCantidadCaja(e.value ?? null)}
              />
            </div>

            <div className="col-6 md:col-3">
              <label className="block font-medium mb-2">Lote</label>
              <InputText
                className="w-full"
                placeholder="Opcional"
                value={filaLote}
                onChange={(e) => setFilaLote(e.target.value)}
              />
            </div>

            <div className="col-6 md:col-3">
              <label className="block font-medium mb-2">Vencimiento</label>
              <Calendar
                className="w-full"
                inputClassName="w-full"
                value={filaVencimiento}
                dateFormat="dd/mm/yy"
                minDate={vencimientoMinimo()}
                showIcon
                placeholder="Opcional"
                onChange={(e) => setFilaVencimiento((e.value as Date) ?? null)}
              />
            </div>

            <div className="col-12 md:col-2">
              <Button className="w-full" icon="pi pi-plus" label="Agregar" onClick={agregarFila} />
            </div>
          </div>
        </div>

        <Divider />

        <div className="flex justify-content-between align-items-center mb-2">
          <span className="font-medium text-900">Productos a cargar</span>
          {loteFilas.length > 0 && (
            <Tag value={`${loteFilas.length} producto${loteFilas.length === 1 ? "" : "s"}`} severity="info" />
          )}
        </div>

        <DataTable
          value={loteFilas}
          size="small"
          stripedRows
          showGridlines
          className="stock-lote-table"
          emptyMessage="Todavía no agregó productos a esta carga"
          scrollable
          scrollHeight="280px"
        >
          <Column field="productoDescripcion" header="Producto" />
          <Column field="depositoNombre" header="Depósito" style={{ width: "160px" }} />
          <Column header="Cant. Unitario" body={(row: FilaIngreso) => formatCantidad(row.cantidadUnitario)} style={{ width: "130px" }} />
          <Column header="Cant. Caja" body={(row: FilaIngreso) => formatCantidad(row.cantidadCaja)} style={{ width: "110px" }} />
          <Column field="lote" header="Lote" body={(row: FilaIngreso) => row.lote || "-"} style={{ width: "110px" }} />
          <Column header="Vencimiento" body={(row: FilaIngreso) => row.vencimiento ? row.vencimiento.toLocaleDateString("es-PY") : "-"} style={{ width: "120px" }} />
          <Column
            header=""
            style={{ width: "60px" }}
            body={(row: FilaIngreso) => (
              <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Quitar" onClick={() => quitarFila(row.id)} />
            )}
          />
        </DataTable>

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" outlined onClick={() => setIngresoOpen(false)} disabled={registrandoLote} />
          <Button
            label={`Registrar${loteFilas.length ? ` (${loteFilas.length})` : ""}`}
            icon="pi pi-check"
            severity="success"
            loading={registrandoLote}
            onClick={registrarLote}
          />
        </div>
      </Dialog>

      <Dialog
        header="Ajustar Stock"
        visible={ajusteOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "400px" }}
        onHide={() => setAjusteOpen(false)}
      >
        {ajusteItem && (
          <div className="flex flex-column gap-3">
            <div>
              <Tag value={ajusteItem.productoDescripcion} />
              <div className="text-color-secondary mt-2" style={{ fontSize: 13 }}>
                {ajusteItem.depositoNombre}
                {ajusteItem.lote ? ` · Lote: ${ajusteItem.lote}` : ""}
                {ajusteItem.vencimiento ? ` · Vto: ${formatFechaDisplay(ajusteItem.vencimiento)}` : ""}
              </div>
            </div>

            <div>
              <label>Stock Unitario</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={ajusteUnitario}
                minFractionDigits={0}
                maxFractionDigits={4}
                onValueChange={(e) => setAjusteUnitario(e.value ?? null)}
              />
            </div>

            <div>
              <label>Stock Caja</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={ajusteCaja}
                minFractionDigits={0}
                maxFractionDigits={4}
                onValueChange={(e) => setAjusteCaja(e.value ?? null)}
              />
            </div>
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" onClick={() => setAjusteOpen(false)} />
          <Button label="Guardar" icon="pi pi-check" severity="success" onClick={guardarAjuste} />
        </div>
      </Dialog>

      <Dialog
        header="Transferir Stock"
        visible={transferenciaOpen}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "560px", maxWidth: "95vw" }}
        contentStyle={{ paddingTop: "0.5rem" }}
        onHide={() => setTransferenciaOpen(false)}
      >
        {transferenciaItem && (
          <div className="flex flex-column gap-4">
            <div
              className="p-3 border-round-lg"
              style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}
            >
              <div className="text-900" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                {transferenciaItem.productoDescripcion}
              </div>
              <div className="text-700 mt-2" style={{ fontSize: "1rem" }}>
                Desde: <strong>{transferenciaItem.depositoNombre}</strong>
                {transferenciaItem.lote ? ` · Lote: ${transferenciaItem.lote}` : ""}
                {transferenciaItem.vencimiento ? ` · Vto: ${formatFechaDisplay(transferenciaItem.vencimiento)}` : ""}
              </div>
              <div className="text-700 mt-1" style={{ fontSize: "1rem" }}>
                Disponible: <strong>{formatCantidad(transferenciaItem.stockActualUnitario)}</strong> unid. / <strong>{formatCantidad(transferenciaItem.stockActualCaja)}</strong> cajas
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2" style={{ fontSize: "1rem" }}>Depósito Destino</label>
              <Dropdown
                className="w-full"
                style={{ fontSize: "1.05rem" }}
                value={transferenciaDepositoDestinoId}
                options={depositos.filter((d) => d.id !== transferenciaItem.depositoId)}
                optionLabel="nombre"
                optionValue="id"
                placeholder="Seleccione depósito"
                onChange={(e) => setTransferenciaDepositoDestinoId(e.value)}
              />
            </div>

            <div className="grid">
              <div className="col-6">
                <label className="block font-medium mb-2" style={{ fontSize: "1rem" }}>Cant. Unitario</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  inputStyle={{ fontSize: "1.05rem", padding: "0.85rem" }}
                  value={transferenciaUnitario}
                  min={0}
                  max={transferenciaItem.stockActualUnitario}
                  minFractionDigits={0}
                  maxFractionDigits={4}
                  onValueChange={(e) => setTransferenciaUnitario(e.value ?? null)}
                />
              </div>

              <div className="col-6">
                <label className="block font-medium mb-2" style={{ fontSize: "1rem" }}>Cant. Caja</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  inputStyle={{ fontSize: "1.05rem", padding: "0.85rem" }}
                  value={transferenciaCaja}
                  min={0}
                  max={transferenciaItem.stockActualCaja}
                  minFractionDigits={0}
                  maxFractionDigits={4}
                  onValueChange={(e) => setTransferenciaCaja(e.value ?? null)}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2" style={{ fontSize: "1rem" }}>Motivo de la transferencia</label>
              <InputTextarea
                className="w-full"
                style={{ fontSize: "1.05rem" }}
                rows={3}
                autoResize
                placeholder="Ej: reposición de góndola, redistribución entre sucursales..."
                value={transferenciaMotivo}
                onChange={(e) => setTransferenciaMotivo(e.target.value)}
              />
              <small className="text-color-secondary">
                La transferencia quedará pendiente de aprobación y no mueve el stock hasta que se apruebe.
              </small>
            </div>
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" outlined onClick={() => setTransferenciaOpen(false)} disabled={transfiriendo} />
          <Button label="Solicitar Transferencia" icon="pi pi-arrow-right-arrow-left" severity="info" loading={transfiriendo} onClick={guardarTransferencia} />
        </div>
      </Dialog>
    </div>
  );
}
