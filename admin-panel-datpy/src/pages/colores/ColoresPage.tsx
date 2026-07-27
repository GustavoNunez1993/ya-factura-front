import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { ColorService } from "../../services/ColorService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface ColorItem {
  id?: string;
  codigo: string;
  descripcion: string;
  colorHex: string;
}

export default function ColoresPage() {
  const [colores, setColores] = useState<ColorItem[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<ColorItem | null>(null);

  const [form, setForm] = useState<ColorItem>({
    codigo: "",
    descripcion: "",
    colorHex: "#2563eb"
  });

  const isMobile = useIsMobile();

  const cargarColores = async () => {
    try {
      const res = await ColorService.getPaginated(page, size, search);
      setColores(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando colores", error);
      setColores([]);
      setTotal(0);
    }
  };

  useEffect(() => {
    cargarColores();
  }, [page, search]);

  const abrirNuevo = () => {
    setEditing(null);
    setViewMode(false);
    setForm({ codigo: "", descripcion: "", colorHex: "#2563eb" });
    setOpen(true);
  };

  const ver = (color: ColorItem) => {
    setViewMode(true);
    setEditing(color);
    setForm({ ...color, colorHex: color.colorHex || "#2563eb" });
    setOpen(true);
  };

  const editar = (color: ColorItem) => {
    setViewMode(false);
    setEditing(color);
    setForm({ ...color, colorHex: color.colorHex || "#2563eb" });
    setOpen(true);
  };

  const guardar = async () => {
    try {
      if (editing) {
        await ColorService.update(editing.id!, form);
        Swal.fire("Actualizado", "Color actualizado correctamente", "success");
      } else {
        await ColorService.create(form);
        Swal.fire("Creado", "Color creado correctamente", "success");
      }
      setOpen(false);
      cargarColores();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar el color", "error");
    }
  };

  const eliminar = async (id?: string) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar color?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await ColorService.remove(id);
      Swal.fire("Eliminado", "Color eliminado correctamente", "success");
      cargarColores();
    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  };

  const accionesTemplate = (rowData: ColorItem) => {
    return (
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
  };

  const colorPreview = (rowData: ColorItem) => {
    return (
      <div className="flex align-items-center gap-2">
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: rowData.colorHex || "#ffffff",
            border: "1px solid #cbd5e1"
          }}
        />
        <span>{rowData.colorHex}</span>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Colores</h2>
          <small className="text-color-secondary">
            Catálogo de colores y valores hexadecimales
          </small>
        </div>

        <Button
          label="Nuevo Color"
          icon="pi pi-plus"
          severity="success"
          onClick={abrirNuevo}
        />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar Color..."
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />
      </div>

      {isMobile ? (
        <>
          {colores.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen colores registrados</p>
          ) : colores.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Código: {item.codigo}</span>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: item.colorHex, border: "1px solid #d1d5db", display: "inline-block" }} />
                  <span>{item.colorHex}</span>
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
          value={colores}
          paginator
          rows={size}
          totalRecords={total}
          lazy
          size="small"
          first={page * size}
          onPage={(e) => setPage(e.page ?? 0)}
          stripedRows
          showGridlines
          emptyMessage="No existen colores registrados"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} colores"
        >
          <Column
            field="codigo"
            header="Código"
            sortable
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
          />
          <Column
            header="Color"
            body={colorPreview}
            style={{ width: "180px" }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "160px" }}
          />
        </DataTable>
      )}

      <Dialog
        header={
          viewMode
            ? "Ver Color"
            : editing
            ? "Editar Color"
            : "Nuevo Color"
        }
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "440px" }}
        onHide={() => setOpen(false)}
      >
        <div className="flex flex-column gap-3">
          <div>
            <label>Código</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.codigo}
              onChange={(e) =>
                setForm({
                  ...form,
                  codigo: e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Descripción</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.descripcion}
              onChange={(e) =>
                setForm({
                  ...form,
                  descripcion: e.target.value
                })
              }
            />
          </div>

          <div>
            <label>Color (hexadecimal)</label>
            <div className="flex align-items-center gap-3">
              <InputText
                className="w-full"
                disabled={viewMode}
                value={form.colorHex}
                onChange={(e) =>
                  setForm({
                    ...form,
                    colorHex: e.target.value
                  })
                }
              />
              <input
                type="color"
                value={form.colorHex}
                disabled={viewMode}
                onChange={(e) =>
                  setForm({
                    ...form,
                    colorHex: e.target.value
                  })
                }
                style={{ width: 56, height: 56, border: "none", padding: 0, background: "transparent", borderRadius: 10, cursor: viewMode ? "not-allowed" : "pointer" }}
              />
            </div>
          </div>
        </div>

        {!viewMode && (
          <div className="flex justify-content-end gap-2 mt-4">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => setOpen(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              severity="success"
              onClick={guardar}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
