import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { BancoService, type Banco } from "../../services/BancoService";
import { useIsMobile } from "../../hooks/useIsMobile";

const formularioInicial: Banco = {
  codigo: "",
  descripcion: ""
};

export default function BancosPage() {

  const [bancos, setBancos] = useState<Banco[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Banco | null>(null);

  const [form, setForm] = useState<Banco>(formularioInicial);

  const isMobile = useIsMobile();

  const cargarBancos = async () => {

    try {

      const res = await BancoService.getAll();
      setBancos(res ?? []);

    } catch (error) {

      console.error("Error cargando bancos", error);
      setBancos([]);

    }

  };

  useEffect(() => {

    cargarBancos();

  }, []);

  useEffect(() => {

    setPage(0);

  }, [search]);

  const bancosFiltrados = useMemo(() => {

    const filtro = search.trim().toLowerCase();

    if (!filtro) return bancos;

    return bancos.filter(
      (b) =>
        b.descripcion?.toLowerCase().includes(filtro) ||
        (b.codigo ?? "").toLowerCase().includes(filtro)
    );

  }, [bancos, search]);

  const total = bancosFiltrados.length;

  const abrirNuevo = () => {

    setEditing(null);
    setViewMode(false);
    setForm(formularioInicial);
    setOpen(true);

  };

  const ver = (banco: Banco) => {

    setViewMode(true);
    setEditing(banco);
    setForm(banco);
    setOpen(true);

  };

  const editar = (banco: Banco) => {

    setViewMode(false);
    setEditing(banco);
    setForm(banco);
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

      if (form.codigo && form.codigo.length > 5) {
        Swal.fire("Atención", "El código no puede tener más de 5 caracteres", "warning");
        return;
      }

      const payload: Banco = {
        codigo: form.codigo?.trim() ? form.codigo.trim() : null,
        descripcion: form.descripcion.trim()
      };

      if (editing?.id) {

        await BancoService.update(editing.id, payload);
        Swal.fire("Actualizado", "Banco actualizado correctamente", "success");

      } else {

        await BancoService.create(payload);
        Swal.fire("Creado", "Banco creado correctamente", "success");

      }

      cerrarDialog();
      cargarBancos();

    } catch (error) {

      console.error("Error guardando banco", error);
      Swal.fire("Error", "No se pudo guardar el banco", "error");

    }

  };

  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar banco?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await BancoService.remove(id);
      Swal.fire("Eliminado", "Banco eliminado correctamente", "success");
      cargarBancos();

    } catch (error) {

      console.error("Error eliminando banco", error);
      Swal.fire("Error", "No se pudo eliminar", "error");

    }

  };

  const accionesTemplate = (rowData: Banco) => (
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

  const estadoBodyTemplate = (rowData: Banco) => {
    const activo = rowData.active !== false;

    return (
      <span
        style={{
          display: "inline-block",
          padding: "0.35rem 0.75rem",
          borderRadius: "12px",
          fontWeight: 600,
          fontSize: "0.85rem",
          minWidth: "90px",
          textAlign: "center",
          backgroundColor: activo ? "#d4edda" : "#f8d7da",
          color: activo ? "#127e2b" : "#721c24"
        }}
      >
        {activo ? "Activo" : "Inactivo"}
      </span>
    );
  };

  const paginaBancos = bancosFiltrados.slice(page * size, page * size + size);

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Bancos</h2>
          <small className="text-color-secondary">Catálogo de bancos</small>
        </div>
        <Button label="Nuevo Banco" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar banco por código o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isMobile ? (
        <>
          {paginaBancos.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen bancos registrados</p>
          ) : paginaBancos.map((item) => (
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                {estadoBodyTemplate(item)}
                {accionesTemplate(item)}
              </div>
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
          value={bancosFiltrados}
          paginator
          rows={size}
          size="small"
          stripedRows
          showGridlines
          scrollable
          scrollHeight="flex"
          emptyMessage="No existen bancos registrados"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} bancos"
        >
          <Column field="codigo" header="Código" sortable style={{ width: "120px", textAlign: "center" }} />
          <Column field="descripcion" header="Descripción" sortable />
          <Column
            field="active"
            header="Estado"
            body={estadoBodyTemplate}
            style={{ width: "120px", textAlign: "center" }}
          />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "140px" }} />
        </DataTable>
      )}

      <Dialog
        header={viewMode ? "Ver Banco" : editing ? "Editar Banco" : "Nuevo Banco"}
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
              maxLength={5}
              value={form.codigo ?? ""}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </div>

          <div>
            <label>Descripción <span className="text-red-500">*</span></label>
            <InputText
              className="w-full"
              disabled={viewMode}
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
