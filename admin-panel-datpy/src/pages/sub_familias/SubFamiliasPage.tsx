import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";

import { SubFamiliaService } from "../../services/SubFamiliaService";
import { FamiliaService } from "../../services/FamiliaService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface Familia {
  id: string;
  descripcion: string;
}

interface SubFamilia {
  id?: string;
  codigo: string;
  descripcion: string;
  familia?: Familia;
}

export default function SubFamiliasPage() {

  const [subFamilias, setSubFamilias] = useState<SubFamilia[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<SubFamilia | null>(null);

  const [form, setForm] = useState<SubFamilia>({
    codigo: "",
    descripcion: ""
  });

  const isMobile = useIsMobile();

  const cargarSubFamilias = async () => {

    try {

      const res = await SubFamiliaService.getPaginated(
        page,
        size,
        search
      );

      setSubFamilias(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);

    } catch (error) {

      console.error("Error cargando subfamilias", error);

      setSubFamilias([]);
      setTotal(0);

    }

  };

  const cargarFamilias = async () => {

    try {

      const res = await FamiliaService.getPaginated(0,100);

      setFamilias(res?.content ?? []);

    } catch (error) {

      console.error("Error cargando familias", error);

    }

  };

  useEffect(() => {

    cargarSubFamilias();
    cargarFamilias();

  }, [page, search]);

  const abrirNuevo = () => {

    setEditing(null);
    setViewMode(false);

    setForm({
      codigo: "",
      descripcion: ""
    });

    setOpen(true);

  };

  const ver = (item: SubFamilia) => {

    setViewMode(true);
    setEditing(item);
    setForm(item);

    setOpen(true);

  };

  const editar = (item: SubFamilia) => {

    setViewMode(false);
    setEditing(item);
    setForm(item);

    setOpen(true);

  };

  const guardar = async () => {

    try {

      if (editing) {

        await SubFamiliaService.update(editing.id!, form);

        Swal.fire(
          "Actualizado",
          "Sub familia actualizada correctamente",
          "success"
        );

      } else {

        await SubFamiliaService.create(form);

        Swal.fire(
          "Creado",
          "Sub familia creada correctamente",
          "success"
        );

      }

      setOpen(false);

      cargarSubFamilias();

    } catch (error) {

      Swal.fire(
        "Error",
        "No se pudo guardar",
        "error"
      );

    }

  };

  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar sub familia?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await SubFamiliaService.remove(id);

      Swal.fire(
        "Eliminado",
        "Sub familia eliminada",
        "success"
      );

      cargarSubFamilias();

    } catch {

      Swal.fire(
        "Error",
        "No se pudo eliminar",
        "error"
      );

    }

  };

  const accionesTemplate = (rowData: SubFamilia) => (

    <div className="flex gap-2 justify-content-center">

      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        onClick={() => ver(rowData)}
      />

      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="warning"
        onClick={() => editar(rowData)}
      />

      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        onClick={() => eliminar(rowData.id)}
      />

    </div>

  );

  return (

    <div className="card">

      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Sub Familias</h2>
          <small className="text-color-secondary">Catálogo de sub familias</small>
        </div>
        <Button label="Nueva SubFamilia" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => { setPage(0); setSearch(e.target.value); }}
        />
      </div>

      {isMobile ? (
        <>
          {subFamilias.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen sub familias registradas</p>
          ) : subFamilias.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  <span>Código: {item.codigo}</span>
                  {item.familia?.descripcion && (
                    <span style={{ marginLeft: 8 }}>Familia: {item.familia.descripcion}</span>
                  )}
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
          value={subFamilias}
          paginator
          rows={size}
          totalRecords={total}
          lazy
          first={page * size}
          onPage={(e) => setPage(e.page ?? 0)}
          stripedRows
          showGridlines
        >

          <Column
            field="codigo"
            header="Código"
            style={{ width: "120px", textAlign: "center" }}
          />

          <Column
            field="descripcion"
            header="Descripción"
          />

          <Column
            field="familia.descripcion"
            header="Familia"
          />

          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ width: "140px" }}
          />

        </DataTable>
      )}

      <Dialog
        header={
          viewMode
            ? "Ver SubFamilia"
            : editing
            ? "Editar SubFamilia"
            : "Nueva SubFamilia"
        }
        visible={open}
        modal
        style={{ width: "420px" }}
        onHide={() => setOpen(false)}
      >

        <div className="flex flex-column gap-3">

          <div>

            <label>Familia</label>

            <Dropdown
              value={form.familia}
              options={familias}
              optionLabel="descripcion"
              placeholder="Seleccione familia"
              className="w-full"
              disabled={viewMode}
              onChange={(e) =>
                setForm({
                  ...form,
                  familia: e.value
                })
              }
            />

          </div>

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