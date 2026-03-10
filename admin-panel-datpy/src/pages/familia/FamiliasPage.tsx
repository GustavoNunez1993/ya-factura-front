import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { FamiliaService } from "../../services/FamiliaService";

interface Familia {
  id?: string;
  codigo: string;
  descripcion: string;
}

export default function FamiliasPage() {

  const [familias, setFamilias] = useState<Familia[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Familia | null>(null);

  const [form, setForm] = useState<Familia>({
    codigo: "",
    descripcion: ""
  });

  const cargarFamilias = async () => {

    try {

      const res = await FamiliaService.getPaginated(
        page,
        size,
        search
      );

      setFamilias(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);

    } catch (error) {

      console.error("Error cargando familias", error);

      setFamilias([]);
      setTotal(0);

    }

  };

  useEffect(() => {

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

  const ver = (familia: Familia) => {

    setViewMode(true);
    setEditing(familia);
    setForm(familia);

    setOpen(true);

  };

  const editar = (familia: Familia) => {

    setViewMode(false);
    setEditing(familia);
    setForm(familia);

    setOpen(true);

  };


  const guardar = async () => {

    try {

      if (editing) {

        await FamiliaService.update(editing.id!, form);

        Swal.fire(
          "Actualizado",
          "Familia actualizada correctamente",
          "success"
        );

      } else {

        await FamiliaService.create(form);

        Swal.fire(
          "Creado",
          "Familia creada correctamente",
          "success"
        );

      }

      setOpen(false);

      cargarFamilias();

    } catch (error) {

      Swal.fire(
        "Error",
        "No se pudo guardar la familia",
        "error"
      );

    }

  };


  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar familia?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await FamiliaService.remove(id);

      Swal.fire(
        "Eliminado",
        "Familia eliminada correctamente",
        "success"
      );

      cargarFamilias();

    } catch (error) {

      Swal.fire(
        "Error",
        "No se pudo eliminar",
        "error"
      );

    }

  };


  const accionesTemplate = (rowData: Familia) => {

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


  return (

    <div className="card">

      <div className="flex justify-content-between align-items-center mb-3">

        <div>

          <h2 className="m-0">Familias</h2>

          <small className="text-color-secondary">
            Catálogo de familias de productos
          </small>

        </div>

        <Button
          label="Nueva Familia"
          icon="pi pi-plus"
          severity="success"
          onClick={abrirNuevo}
        />

      </div>


      <span className="p-input-icon-left mb-3">

        <i className="pi pi-search" />

        <InputText
          placeholder="Buscar familia..."
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />

      </span>


      <DataTable
        value={familias}
        paginator
        rows={size}
        totalRecords={total}
        lazy
        size="small"
        first={page * size}
        onPage={(e) => setPage(e.page ?? 0)}
        stripedRows
        showGridlines
        responsiveLayout="scroll"
        emptyMessage="No existen familias registradas"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} familias"
      >

        <Column
          field="codigo"
          header="Código"
          sortable
          style={{ width: "100px", textAlign: "center" }}
        />

        <Column
          field="descripcion"
          header="Descripción"
          sortable
        />

        <Column
          header="Acciones"
          body={accionesTemplate}
          style={{ width: "140px" }}
        />

      </DataTable>


      <Dialog
        header={
          viewMode
            ? "Ver familia"
            : editing
            ? "Editar familia"
            : "Nueva familia"
        }
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "400px" }}
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