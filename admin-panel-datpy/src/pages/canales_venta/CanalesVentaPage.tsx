import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { CanalVentaService, type CanalVenta } from "../../services/CanalVentaService";
import { useIsMobile } from "../../hooks/useIsMobile";

const formularioInicial: CanalVenta = {
  codigo: "",
  descripcion: ""
};

export default function CanalesVentaPage() {

  const [canales, setCanales] = useState<CanalVenta[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<CanalVenta | null>(null);

  const [form, setForm] = useState<CanalVenta>(formularioInicial);

  const isMobile = useIsMobile();

  const cargarCanales = async () => {

    try {

      const res = await CanalVentaService.getAll();
      setCanales(res ?? []);

    } catch (error) {

      console.error("Error cargando canales de venta", error);
      setCanales([]);

    }

  };

  useEffect(() => {

    cargarCanales();

  }, []);

  useEffect(() => {

    setPage(0);

  }, [search]);

  const canalesFiltrados = useMemo(() => {

    const filtro = search.trim().toLowerCase();

    if (!filtro) return canales;

    return canales.filter(
      (c) =>
        c.descripcion?.toLowerCase().includes(filtro) ||
        (c.codigo ?? "").toLowerCase().includes(filtro)
    );

  }, [canales, search]);

  const total = canalesFiltrados.length;

  const abrirNuevo = () => {

    setEditing(null);
    setViewMode(false);
    setForm(formularioInicial);
    setOpen(true);

  };

  const ver = (canal: CanalVenta) => {

    setViewMode(true);
    setEditing(canal);
    setForm(canal);
    setOpen(true);

  };

  const editar = (canal: CanalVenta) => {

    setViewMode(false);
    setEditing(canal);
    setForm(canal);
    setOpen(true);

  };

  const cerrarDialog = () => {

    setOpen(false);
    setViewMode(false);
    setEditing(null);
    setForm(formularioInicial);

  };

  const guardar = async () => {

    try {

      if (!form.descripcion.trim()) {
        Swal.fire("Atención", "La descripción es obligatoria", "warning");
        return;
      }

      const payload: CanalVenta = {
        codigo: form.codigo?.trim() ? form.codigo.trim() : null,
        descripcion: form.descripcion.trim()
      };

      if (editing?.id) {

        await CanalVentaService.update(editing.id, payload);
        Swal.fire("Actualizado", "Canal de venta actualizado correctamente", "success");

      } else {

        await CanalVentaService.create(payload);
        Swal.fire("Creado", "Canal de venta creado correctamente", "success");

      }

      cerrarDialog();
      cargarCanales();

    } catch (error) {

      console.error("Error guardando canal de venta", error);
      Swal.fire("Error", "No se pudo guardar el canal de venta", "error");

    }

  };

  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar canal de venta?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await CanalVentaService.remove(id);
      Swal.fire("Eliminado", "Canal de venta eliminado correctamente", "success");
      cargarCanales();

    } catch (error) {

      console.error("Error eliminando canal de venta", error);
      Swal.fire("Error", "No se pudo eliminar", "error");

    }

  };

  const accionesTemplate = (rowData: CanalVenta) => (
    <div className="flex gap-2 justify-content-center">
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        tooltip="Ver"
        onClick={() => ver(rowData)}
      />
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="warning"
        tooltip="Editar"
        onClick={() => editar(rowData)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        tooltip="Eliminar"
        onClick={() => eliminar(rowData.id)}
      />
    </div>
  );

  const paginaCanales = canalesFiltrados.slice(page * size, page * size + size);

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Canales de Venta</h2>
          <small className="text-color-secondary">Tienda, WhatsApp, correo, etc.</small>
        </div>
        <Button label="Nuevo Canal" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar canal por código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isMobile ? (
        <>
          {paginaCanales.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen canales de venta registrados</p>
          ) : paginaCanales.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 8,
                background: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                {item.codigo && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Código: {item.codigo}</div>
                )}
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
          value={canalesFiltrados}
          paginator
          rows={size}
          size="small"
          stripedRows
          showGridlines
          scrollable
          scrollHeight="flex"
          emptyMessage="No existen canales de venta registrados"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} canales"
        >
          <Column field="codigo" header="Código" sortable style={{ width: "120px", textAlign: "center" }} />
          <Column field="descripcion" header="Descripción" sortable />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "140px" }} />
        </DataTable>
      )}

      <Dialog
        header={viewMode ? "Ver Canal de Venta" : editing ? "Editar Canal de Venta" : "Nuevo Canal de Venta"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "400px" }}
        onHide={cerrarDialog}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label>Código</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.codigo ?? ""}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </div>

          <div>
            <label>Descripción <span className="text-red-500">*</span></label>
            <InputText
              className="w-full"
              disabled={viewMode}
              placeholder="Ej: Tienda, WhatsApp, Correo..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
        </div>

        {!viewMode && (
          <div className="flex justify-content-end gap-2 mt-4">
            <Button label="Cancelar" severity="secondary" onClick={cerrarDialog} />
            <Button label="Guardar" icon="pi pi-check" severity="success" onClick={guardar} />
          </div>
        )}
      </Dialog>
    </div>
  );
}
