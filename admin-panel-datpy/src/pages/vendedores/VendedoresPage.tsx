import { useEffect, useMemo, useState } from "react";

import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import { VendedorService, type Vendedor } from "../../services/VendedorService";
import { CargoService, type Cargo } from "../../services/CargoService";
import { useIsMobile } from "../../hooks/useIsMobile";
import { countries, defaultCountry, flagEmoji, parsePhoneNumber, type CountryDialCode } from "../../utils/countries";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formularioInicial: Vendedor = {
  codigo: "",
  nombre: "",
  celular: "",
  direccion: "",
  email: "",
  cargoId: null
};

export default function VendedoresPage() {

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const size = 10;

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [editing, setEditing] = useState<Vendedor | null>(null);

  const [form, setForm] = useState<Vendedor>(formularioInicial);
  const [celularPaisIso2, setCelularPaisIso2] = useState<string>(defaultCountry.iso2);

  const isMobile = useIsMobile();

  const emailValido = !form.email?.trim() || EMAIL_REGEX.test(form.email.trim());
  const celularPais = countries.find((c) => c.iso2 === celularPaisIso2) ?? defaultCountry;

  const cargarVendedores = async () => {

    try {

      const res = await VendedorService.getAll();
      setVendedores(res ?? []);

    } catch (error) {

      console.error("Error cargando vendedores", error);
      setVendedores([]);

    }

  };

  const cargarCargos = async () => {

    try {

      const res = await CargoService.getAll();
      setCargos(res ?? []);

    } catch (error) {

      console.error("Error cargando cargos", error);
      setCargos([]);

    }

  };

  useEffect(() => {

    cargarVendedores();
    cargarCargos();

  }, []);

  useEffect(() => {

    setPage(0);

  }, [search]);

  const vendedoresFiltrados = useMemo(() => {

    const filtro = search.trim().toLowerCase();

    if (!filtro) return vendedores;

    return vendedores.filter(
      (v) =>
        v.nombre?.toLowerCase().includes(filtro) ||
        (v.codigo ?? "").toLowerCase().includes(filtro) ||
        (v.cargo?.descripcion ?? "").toLowerCase().includes(filtro) ||
        (v.email ?? "").toLowerCase().includes(filtro)
    );

  }, [vendedores, search]);

  const total = vendedoresFiltrados.length;

  const abrirNuevo = () => {

    setEditing(null);
    setViewMode(false);
    setForm(formularioInicial);
    setCelularPaisIso2(defaultCountry.iso2);
    setOpen(true);

  };

  const ver = (vendedor: Vendedor) => {

    const { country, numero } = parsePhoneNumber(vendedor.celular);

    setViewMode(true);
    setEditing(vendedor);
    setForm({ ...vendedor, celular: numero, cargoId: vendedor.cargo?.id ?? null });
    setCelularPaisIso2(country.iso2);
    setOpen(true);

  };

  const editar = (vendedor: Vendedor) => {

    const { country, numero } = parsePhoneNumber(vendedor.celular);

    setViewMode(false);
    setEditing(vendedor);
    setForm({ ...vendedor, celular: numero, cargoId: vendedor.cargo?.id ?? null });
    setCelularPaisIso2(country.iso2);
    setOpen(true);

  };

  const cerrarDialog = () => {

    setOpen(false);
    setViewMode(false);
    setEditing(null);
    setForm(formularioInicial);
    setCelularPaisIso2(defaultCountry.iso2);

  };

  const guardar = async () => {

    try {

      if (!form.nombre.trim()) {
        Swal.fire("Atención", "El nombre es obligatorio", "warning");
        return;
      }

      if (form.email?.trim() && !EMAIL_REGEX.test(form.email.trim())) {
        Swal.fire("Atención", "El correo electrónico no es válido", "warning");
        return;
      }

      const payload: Vendedor = {
        codigo: form.codigo?.trim() ? form.codigo.trim() : null,
        nombre: form.nombre.trim(),
        celular: form.celular?.trim() ? `${celularPais.dialCode} ${form.celular.trim()}` : null,
        direccion: form.direccion?.trim() ? form.direccion.trim() : null,
        email: form.email?.trim() ? form.email.trim() : null,
        cargoId: form.cargoId ?? null
      };

      if (editing?.id) {

        await VendedorService.update(editing.id, payload);
        Swal.fire("Actualizado", "Vendedor actualizado correctamente", "success");

      } else {

        await VendedorService.create(payload);
        Swal.fire("Creado", "Vendedor creado correctamente", "success");

      }

      cerrarDialog();
      cargarVendedores();

    } catch (error) {

      console.error("Error guardando vendedor", error);
      Swal.fire("Error", "No se pudo guardar el vendedor", "error");

    }

  };

  const eliminar = async (id?: string) => {

    if (!id) return;

    const result = await Swal.fire({
      title: "¿Eliminar vendedor?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {

      await VendedorService.remove(id);
      Swal.fire("Eliminado", "Vendedor eliminado correctamente", "success");
      cargarVendedores();

    } catch (error) {

      console.error("Error eliminando vendedor", error);
      Swal.fire("Error", "No se pudo eliminar", "error");

    }

  };

  const cargoBodyTemplate = (rowData: Vendedor) => rowData.cargo?.descripcion ?? "-";

  const countryItemTemplate = (option: CountryDialCode) => (
    <div className="flex align-items-center gap-2">
      <span style={{ fontSize: "1.1rem" }}>{flagEmoji(option.iso2)}</span>
      <span className="flex-1">{option.name}</span>
      <span className="text-color-secondary">{option.dialCode}</span>
    </div>
  );

  const countryValueTemplate = (option: CountryDialCode | undefined) => {
    if (!option) return <span>Seleccione</span>;

    return (
      <span className="flex align-items-center gap-2">
        <span style={{ fontSize: "1.1rem" }}>{flagEmoji(option.iso2)}</span>
        <span>{option.dialCode}</span>
      </span>
    );
  };

  const accionesTemplate = (rowData: Vendedor) => (
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

  const paginaVendedores = vendedoresFiltrados.slice(page * size, page * size + size);

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Vendedores</h2>
          <small className="text-color-secondary">Equipo de ventas de la empresa</small>
        </div>
        <Button label="Nuevo Vendedor" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar vendedor por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isMobile ? (
        <>
          {paginaVendedores.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>No existen vendedores registrados</p>
          ) : paginaVendedores.map((item) => (
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
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.nombre}</div>
                {item.cargo?.descripcion && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.cargo.descripcion}</div>
                )}
                {item.codigo && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Código: {item.codigo}</div>
                )}
                {item.celular && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Cel: {item.celular}</div>
                )}
                {item.email && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{item.email}</div>
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
          value={vendedoresFiltrados}
          paginator
          rows={size}
          size="small"
          stripedRows
          showGridlines
          scrollable
          scrollHeight="flex"
          emptyMessage="No existen vendedores registrados"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} vendedores"
        >
          <Column field="codigo" header="Código" sortable style={{ width: "110px", textAlign: "center" }} />
          <Column field="nombre" header="Nombre" sortable />
          <Column header="Cargo" body={cargoBodyTemplate} />
          <Column field="celular" header="Celular" />
          <Column field="email" header="Correo" />
          <Column field="direccion" header="Dirección" />
          <Column header="Acciones" body={accionesTemplate} style={{ width: "140px" }} />
        </DataTable>
      )}

      <Dialog
        header={viewMode ? "Ver Vendedor" : editing ? "Editar Vendedor" : "Nuevo Vendedor"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "580px", maxWidth: "95vw" }}
        onHide={cerrarDialog}
      >
        <div className="flex flex-column gap-4">
          <div className="flex gap-3 flex-wrap">
            <div style={{ flex: "0 0 140px" }}>
              <label>Código</label>
              <InputText
                className="w-full"
                disabled={viewMode}
                value={form.codigo ?? ""}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>

            <div style={{ flex: "1 1 220px" }}>
              <label>Cargo</label>
              <Dropdown
                className="w-full"
                disabled={viewMode}
                value={form.cargoId ?? null}
                options={cargos}
                optionLabel="descripcion"
                optionValue="id"
                placeholder="Seleccione cargo"
                filter
                filterBy="descripcion"
                filterPlaceholder="Buscar cargo..."
                showClear
                emptyMessage="No hay cargos cargados"
                emptyFilterMessage="No se encontraron cargos"
                onChange={(e) => setForm({ ...form, cargoId: e.value })}
              />
            </div>
          </div>

          <div>
            <label>Nombre <span className="text-red-500">*</span></label>
            <InputText
              className="w-full"
              disabled={viewMode}
              placeholder="Nombre y apellido"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>

          <div>
            <label>Celular</label>
            <div className="flex gap-2">
              <Dropdown
                style={{ flex: "0 0 130px" }}
                disabled={viewMode}
                value={celularPaisIso2}
                options={countries}
                optionLabel="name"
                optionValue="iso2"
                itemTemplate={countryItemTemplate}
                valueTemplate={countryValueTemplate}
                filter
                filterBy="name"
                filterPlaceholder="Buscar país..."
                onChange={(e) => setCelularPaisIso2(e.value)}
              />
              <InputText
                className="flex-1"
                disabled={viewMode}
                placeholder="0981 234 567"
                value={form.celular ?? ""}
                onChange={(e) => setForm({ ...form, celular: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label>Correo</label>
            <InputText
              className={`w-full ${!emailValido ? "p-invalid" : ""}`}
              disabled={viewMode}
              placeholder="correo@empresa.com"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {!emailValido && (
              <small className="text-red-500">Ingrese un correo electrónico válido</small>
            )}
          </div>

          <div>
            <label>Dirección</label>
            <InputText
              className="w-full"
              disabled={viewMode}
              value={form.direccion ?? ""}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
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
