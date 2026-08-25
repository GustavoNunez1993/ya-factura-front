import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { CondicionVentaService, type CondicionVenta } from "../../services/CondicionVentaService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface CondicionVentaForm {
  id?: string;
  tipoOperacion: number;
  descripcion: string;
  tipoCondicionCredito: number | null;
  cantidadCuotas: number | null;
  intervaloDias: number | null;
  tieneCuotaInicial: boolean;
  montoCuotaInicial: number | null;
  predeterminada: boolean;
}

const formVacio: CondicionVentaForm = {
  tipoOperacion: 1,
  descripcion: "",
  tipoCondicionCredito: null,
  cantidadCuotas: null,
  intervaloDias: null,
  tieneCuotaInicial: false,
  montoCuotaInicial: null,
  predeterminada: false
};

const tiposOperacion = [
  { label: "Contado", value: 1 },
  { label: "Crédito", value: 2 }
];

const tiposCondicionCredito = [
  { label: "Plazo", value: 1 },
  { label: "Cuota", value: 2 }
];

const opcionesSiNo = [
  { label: "Sí", value: true },
  { label: "No", value: false }
];

export default function CondicionesVentaPage() {
  const [condiciones, setCondiciones] = useState<CondicionVenta[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<CondicionVenta | null>(null);
  const [form, setForm] = useState<CondicionVentaForm>(formVacio);

  const isMobile = useIsMobile();
  const esCredito = form.tipoOperacion === 2;
  const esPlazo = form.tipoCondicionCredito === 1;
  const esCuota = form.tipoCondicionCredito === 2;

  const cargarCondiciones = async () => {
    try {
      const res = await CondicionVentaService.getPaginated(page, size);

      setCondiciones(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando Condiciones de Venta", error);

      setCondiciones([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    cargarCondiciones();
  }, [page]);

  const abrirNuevo = () => {
    setEditing(null);
    setViewMode(false);
    setForm(formVacio);
    setOpen(true);
  };

  const cargarForm = (condicion: CondicionVenta): CondicionVentaForm => ({
    id: condicion.id,
    tipoOperacion: condicion.tipoOperacion,
    descripcion: condicion.descripcion,
    tipoCondicionCredito: condicion.tipoCondicionCredito,
    cantidadCuotas: condicion.cantidadCuotas,
    intervaloDias: condicion.intervaloDias,
    tieneCuotaInicial: condicion.tieneCuotaInicial,
    montoCuotaInicial: condicion.montoCuotaInicial,
    predeterminada: condicion.predeterminada
  });

  const ver = (condicion: CondicionVenta) => {
    setViewMode(true);
    setEditing(condicion);
    setForm(cargarForm(condicion));
    setOpen(true);
  };

  const editar = (condicion: CondicionVenta) => {
    setViewMode(false);
    setEditing(condicion);
    setForm(cargarForm(condicion));
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.descripcion.trim()) {
      Swal.fire("Atención", "La descripción es obligatoria", "warning");
      return;
    }

    if (esCredito && !form.tipoCondicionCredito) {
      Swal.fire("Atención", "Seleccione el tipo de condición de crédito", "warning");
      return;
    }

    if (esCredito && esPlazo && !form.intervaloDias) {
      Swal.fire("Atención", "Indique el intervalo en días", "warning");
      return;
    }

    if (esCredito && esCuota && !form.cantidadCuotas) {
      Swal.fire("Atención", "Indique la cantidad de cuotas", "warning");
      return;
    }

    if (esCredito && form.tieneCuotaInicial && !form.montoCuotaInicial) {
      Swal.fire("Atención", "Indique el monto de la cuota inicial", "warning");
      return;
    }

    try {
      const payload = { ...form, descripcion: form.descripcion.trim() };

      if (editing) {
        await CondicionVentaService.update(editing.id, payload);
        Swal.fire("Actualizada", "Condición de venta actualizada correctamente", "success");
      } else {
        await CondicionVentaService.create(payload);
        Swal.fire("Creada", "Condición de venta creada correctamente", "success");
      }

      setOpen(false);
      cargarCondiciones();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar la condición de venta", "error");
    }
  };

  const eliminar = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar condición de venta?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await CondicionVentaService.remove(id);
      Swal.fire("Eliminada", "Condición de venta eliminada correctamente", "success");
      cargarCondiciones();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  };

  const tipoTemplate = (rowData: CondicionVenta) => (
    <Tag value={rowData.tipoOperacion === 2 ? "Crédito" : "Contado"} severity={rowData.tipoOperacion === 2 ? "warning" : "success"} />
  );

  const estadoTemplate = (rowData: CondicionVenta) => (
    <Tag value={rowData.active ? "Activo" : "Inactivo"} severity={rowData.active ? "success" : "danger"} />
  );

  const predeterminadaTemplate = (rowData: CondicionVenta) =>
    rowData.predeterminada ? <Tag value="Por defecto" severity="info" icon="pi pi-star-fill" /> : null;

  const accionesTemplate = (rowData: CondicionVenta) => (
    <div className="flex gap-2 justify-content-center">
      <Button icon="pi pi-eye" rounded text severity="info" tooltip="Ver" onClick={() => ver(rowData)} />
      <Button icon="pi pi-pencil" rounded text severity="warning" tooltip="Editar" onClick={() => editar(rowData)} />
      <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" onClick={() => eliminar(rowData.id)} />
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Condiciones de Venta</h2>
          <small className="text-color-secondary">Contado, crédito y sus condiciones de plazo/cuotas usadas en Facturación</small>
        </div>
        <Button label="Nueva Condición" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      {isMobile ? (
        <>
          {condiciones.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen condiciones de venta registradas</p>
          ) : condiciones.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="flex align-items-center gap-2">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</span>
                  {item.predeterminada && <Tag value="Por defecto" severity="info" icon="pi pi-star-fill" />}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  {item.tipoOperacion === 2 ? "Crédito" : "Contado"}
                  {item.tipoOperacion === 2 && item.cantidadCuotas ? ` · ${item.cantidadCuotas} cuota(s)` : ""}
                </div>
              </div>
              {accionesTemplate(item)}
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
          value={condiciones}
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
          emptyMessage="No existen condiciones de venta registradas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} condiciones"
        >
          <Column header="Tipo" body={tipoTemplate} style={{ width: "110px" }} />
          <Column field="descripcion" header="Descripción" sortable />
          <Column field="cantidadCuotas" header="Cuotas" body={(row: CondicionVenta) => row.cantidadCuotas ?? "-"} style={{ width: "90px" }} />
          <Column field="intervaloDias" header="Intervalo (días)" body={(row: CondicionVenta) => row.intervaloDias ?? "-"} style={{ width: "130px" }} />
          <Column header="Estado" body={estadoTemplate} style={{ width: "110px" }} />
          <Column header="Por defecto" body={predeterminadaTemplate} style={{ width: "130px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "140px" }} />
        </DataTable>
      )}

      <Dialog
        header={viewMode ? "Ver Condición de Venta" : editing ? "Editar Condición de Venta" : "Nueva Condición de Venta"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "520px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div className="grid">
            <div className="col-6">
              <label>Tipo operación *</label>
              <Dropdown
                className="w-full"
                disabled={viewMode}
                value={form.tipoOperacion}
                options={tiposOperacion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoOperacion: e.value,
                    ...(e.value === 1
                      ? { tipoCondicionCredito: null, cantidadCuotas: null, intervaloDias: null, tieneCuotaInicial: false, montoCuotaInicial: null }
                      : {})
                  })
                }
              />
            </div>

            {esCredito && (
              <div className="col-6">
                <label>Tipo condición crédito *</label>
                <Dropdown
                  className="w-full"
                  disabled={viewMode}
                  value={form.tipoCondicionCredito}
                  options={tiposCondicionCredito}
                  placeholder="Seleccione"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipoCondicionCredito: e.value,
                      ...(e.value === 1
                        ? { cantidadCuotas: 1, tieneCuotaInicial: false, montoCuotaInicial: null }
                        : {})
                    })
                  }
                />
              </div>
            )}
          </div>

          {esCredito && (
            <div className="grid">
              <div className="col-6">
                <label>Cant. Cuotas{esCuota ? " *" : ""}</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  disabled={viewMode || esPlazo}
                  value={form.cantidadCuotas}
                  min={1}
                  onValueChange={(e) => setForm({ ...form, cantidadCuotas: e.value ?? null })}
                />
              </div>

              <div className="col-6">
                <label>Intervalo en días{esPlazo ? " *" : ""}</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  disabled={viewMode}
                  value={form.intervaloDias}
                  min={1}
                  onValueChange={(e) => setForm({ ...form, intervaloDias: e.value ?? null })}
                />
              </div>
            </div>
          )}

          {esCredito && (
            <div className="grid align-items-end">
              <div className="col-6">
                <label>Cuota inicial *</label>
                <Dropdown
                  className="w-full"
                  disabled={viewMode || esPlazo}
                  value={form.tieneCuotaInicial}
                  options={opcionesSiNo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tieneCuotaInicial: e.value,
                      montoCuotaInicial: e.value ? form.montoCuotaInicial : null
                    })
                  }
                />
              </div>

              {form.tieneCuotaInicial && (
                <div className="col-6">
                  <label>Monto cuota inicial *</label>
                  <InputNumber
                    className="w-full"
                    inputClassName="w-full"
                    disabled={viewMode}
                    value={form.montoCuotaInicial}
                    min={0}
                    mode="decimal"
                    onValueChange={(e) => setForm({ ...form, montoCuotaInicial: e.value ?? null })}
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label>Descripción *</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <Checkbox
              inputId="predeterminada"
              disabled={viewMode}
              checked={form.predeterminada}
              onChange={(e) => setForm({ ...form, predeterminada: e.checked ?? false })}
            />
            <label htmlFor="predeterminada" className="m-0">
              Marcar como condición de venta por defecto para factura
            </label>
          </div>
        </div>

        {!viewMode && (
          <div className="flex justify-content-end gap-2 mt-4">
            <Button label="Cancelar" severity="secondary" onClick={() => setOpen(false)} />
            <Button label="Guardar" icon="pi pi-check" severity="success" onClick={guardar} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
