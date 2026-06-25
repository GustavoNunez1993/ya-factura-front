import { useEffect, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { MarcaService } from "../../services/MarcasService";
import { useIsMobile } from "../../hooks/useIsMobile";

interface Marca {
  id?: string;
  codigo: string;
  descripcion: string;
}

export default function MarcasPage() {

  const [Marcas, setMarcas] = useState<Marca[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;

  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Marca | null>(null);

  const [form, setForm] = useState<Marca>({
    codigo: "",
    descripcion: ""
  });

  const isMobile = useIsMobile();

  const cargarMarcas = async () => {

    try {

      const res = await MarcaService.getPaginated(
        page,
        size,
        search
      );

      setMarcas(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);

    } catch (error) {

      console.error("Error cargando Marcas", error);

      setMarcas([]);
      setTotal(0);

    }

  };

  useEffect(() => {

    cargarMarcas();

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

  const ver = (Marca: Marca) => {

    setViewMode(true);
    setEditing(Marca);
    setForm(Marca);

    setOpen(true);

  };

  const editar = (Marca: Marca) => {

    setViewMode(false);
    setEditing(Marca);
    setForm(Marca);

    setOpen(true);

  };


  const guardar = async () => {

    try {

      if (editing) {

        await MarcaService.update(editing.id!, form);

        Swal.fire(
          "Actualizado",
          "Marca actualizada correctamente",
          "success"
        );

      } else {

        await MarcaService.create(form);

        Swal.fire(
          "Creado",
          "Marca creada correctamente",
          "success"
        );

      }

      setOpen(false);

      cargarMarcas();

    } catch (error) {

      Swal.fire(
        "Error",
        "No se pudo guardar la Marca",
        "error"
      );

    }

  };


  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar Marca?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await MarcaService.remove(id);

      Swal.fire(
        "Eliminado",
        "Marca eliminada correctamente",
        "success"
      );

      cargarMarcas();

    } catch (error) {

      Swal.fire(
        "Error",
        "No se pudo eliminar",
        "error"
      );

    }

  };


  const accionesTemplate = (rowData: Marca) => {

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

      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Marcas</h2>
          <small className="text-color-secondary">Catálogo de Marcas de productos</small>
        </div>
        <Button label="Nueva Marca" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar Marca..."
          value={search}
          onChange={(e) => { setPage(0); setSearch(e.target.value); }}
        />
      </div>


      {isMobile ? (
        <>
          {Marcas.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen Marcas registradas</p>
          ) : Marcas.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.descripcion}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  <span>Código: {item.codigo}</span>
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
          value={Marcas}
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
          emptyMessage="No existen Marcas registradas"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Marcas"
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
      )}


      <Dialog
        header={
          viewMode
            ? "Ver Marca"
            : editing
            ? "Editar Marca"
            : "Nueva Marca"
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