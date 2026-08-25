import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { DepositoService, type Deposito } from "../../services/DepositoService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface DepositoForm {
  id?: string;
  nombre: string;
  direccion: string;
  esPrincipal: boolean;
}

const formVacio: DepositoForm = { nombre: "", direccion: "", esPrincipal: false };

export default function DepositosPage() {
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Deposito | null>(null);
  const [form, setForm] = useState<DepositoForm>(formVacio);

  const isMobile = useIsMobile();

  const cargarDepositos = async () => {
    try {
      const res = await DepositoService.getPaginated(page, size);

      setDepositos(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando Depósitos", error);

      setDepositos([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    cargarDepositos();
  }, [page]);

  const abrirNuevo = () => {
    setEditing(null);
    setViewMode(false);
    setForm(formVacio);
    setOpen(true);
  };

  const ver = (deposito: Deposito) => {
    setViewMode(true);
    setEditing(deposito);
    setForm({ id: deposito.id, nombre: deposito.nombre, direccion: deposito.direccion ?? "", esPrincipal: deposito.esPrincipal });
    setOpen(true);
  };

  const editar = (deposito: Deposito) => {
    setViewMode(false);
    setEditing(deposito);
    setForm({ id: deposito.id, nombre: deposito.nombre, direccion: deposito.direccion ?? "", esPrincipal: deposito.esPrincipal });
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      Swal.fire("Atención", "El nombre del depósito es obligatorio", "warning");
      return;
    }

    try {
      if (editing) {
        await DepositoService.update(editing.id, form);
        Swal.fire("Actualizado", "Depósito actualizado correctamente", "success");
      } else {
        await DepositoService.create(form);
        Swal.fire("Creado", "Depósito creado correctamente", "success");
      }

      setOpen(false);
      cargarDepositos();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el depósito", "error");
    }
  };

  const eliminar = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar depósito?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await DepositoService.remove(id);
      Swal.fire("Eliminado", "Depósito eliminado correctamente", "success");
      cargarDepositos();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  };

  const estadoTemplate = (rowData: Deposito) => (
    <Tag value={rowData.active ? "Activo" : "Inactivo"} severity={rowData.active ? "success" : "danger"} />
  );

  const principalTemplate = (rowData: Deposito) =>
    rowData.esPrincipal ? <Tag value="Principal" severity="info" icon="pi pi-star-fill" /> : null;

  const accionesTemplate = (rowData: Deposito) => (
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
          <h2 className="m-0">Depósitos</h2>
          <small className="text-color-secondary">Almacenes y sucursales donde se guarda el stock</small>
        </div>
        <Button label="Nuevo Depósito" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      {isMobile ? (
        <>
          {depositos.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen depósitos registrados</p>
          ) : depositos.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="flex align-items-center gap-2">
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.nombre}</span>
                  {item.esPrincipal && <Tag value="Principal" severity="info" icon="pi pi-star-fill" />}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.direccion || "Sin dirección"}</div>
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
          value={depositos}
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
          emptyMessage="No existen depósitos registrados"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} depósitos"
        >
          <Column field="nombre" header="Nombre" sortable />
          <Column field="direccion" header="Dirección" />
          <Column header="Estado" body={estadoTemplate} style={{ width: "120px" }} />
          <Column header="Principal" body={principalTemplate} style={{ width: "130px" }} />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "140px" }} />
        </DataTable>
      )}

      <Dialog
        header={viewMode ? "Ver Depósito" : editing ? "Editar Depósito" : "Nuevo Depósito"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "400px" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label>Nombre</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div>
            <label>Dirección</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </div>

          <div className="flex align-items-center gap-2">
            <Checkbox
              inputId="esPrincipal"
              disabled={viewMode}
              checked={form.esPrincipal}
              onChange={(e) => setForm({ ...form, esPrincipal: e.checked ?? false })}
            />
            <label htmlFor="esPrincipal" className="m-0">
              Depósito principal (se usa por defecto al facturar)
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
