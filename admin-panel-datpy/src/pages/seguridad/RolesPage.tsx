import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";

import { usePermisos } from "../../hooks/usePermisos";
import type { Accion, Menu } from "../../seguridad/permisos";
import { SeguridadService, mensajeError, type GrupoCatalogo, type Rol } from "../../services/SeguridadService";

interface Form {
  nombre: string;
  descripcion: string;
  /** "MENU.ACCION" */
  permisos: Set<string>;
}

const clave = (menu: string, accion: string) => `${menu}.${accion}`;

const formVacio = (): Form => ({ nombre: "", descripcion: "", permisos: new Set() });

/**
 * Roles (globales, iguales para todas las empresas) y sus permisos menú × acción. El rol
 * administrador tiene todo y no se edita. Quien no es administrador sólo puede otorgar los
 * permisos que él mismo tiene (el back lo valida igual).
 */
export default function RolesPage() {
  const { puede, esAdministrador } = usePermisos();

  const [roles, setRoles] = useState<Rol[]>([]);
  const [catalogo, setCatalogo] = useState<GrupoCatalogo[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Rol | null>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [form, setForm] = useState<Form>(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const [r, c] = await Promise.all([SeguridadService.roles(), SeguridadService.catalogo()]);
      setRoles(r);
      setCatalogo(c);
    } catch (error) {
      console.error("Error cargando roles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const totalPermisos = useMemo(
    () => catalogo.reduce((t, g) => t + g.menus.reduce((tm, m) => tm + m.acciones.length, 0), 0),
    [catalogo]
  );

  const abrir = (rol: Rol | null, lectura = false) => {
    setEditando(rol);
    setSoloLectura(lectura || !!rol?.administrador);
    setForm(
      rol
        ? {
            nombre: rol.nombre,
            descripcion: rol.descripcion ?? "",
            permisos: new Set(Object.entries(rol.permisos).flatMap(([m, as]) => as.map((a) => clave(m, a))))
          }
        : formVacio()
    );
    setOpen(true);
  };

  const otorgable = (menu: string, accion: string) => esAdministrador || puede(menu as Menu, accion as Accion);

  const alternar = (menu: string, accion: string, marcado: boolean) => {
    setForm((prev) => {
      const permisos = new Set(prev.permisos);
      if (marcado) permisos.add(clave(menu, accion));
      else permisos.delete(clave(menu, accion));
      return { ...prev, permisos };
    });
  };

  const alternarMenu = (menu: string, acciones: string[], marcar: boolean) => {
    setForm((prev) => {
      const permisos = new Set(prev.permisos);
      acciones.filter((a) => otorgable(menu, a)).forEach((a) => (marcar ? permisos.add(clave(menu, a)) : permisos.delete(clave(menu, a))));
      return { ...prev, permisos };
    });
  };

  const guardar = async () => {
    if (form.nombre.trim().length < 3) {
      Swal.fire("Atención", "El nombre del rol debe tener al menos 3 caracteres", "warning");
      return;
    }
    const permisos: Record<string, string[]> = {};
    form.permisos.forEach((k) => {
      const [menu, accion] = k.split(".");
      (permisos[menu] ??= []).push(accion);
    });
    const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), permisos };

    try {
      setGuardando(true);
      if (editando) await SeguridadService.actualizarRol(editando.id, payload);
      else await SeguridadService.crearRol(payload);
      Swal.fire("Listo", editando ? "Rol actualizado" : "Rol creado", "success");
      setOpen(false);
      cargar();
    } catch (error) {
      Swal.fire("Error", mensajeError(error, "No se pudo guardar el rol"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (rol: Rol) => {
    const r = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar el rol ${rol.nombre}?`,
      text: "Los roles son de todo el sistema: se elimina para todas las empresas.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626"
    });
    if (!r.isConfirmed) return;
    try {
      await SeguridadService.eliminarRol(rol.id);
      cargar();
    } catch (error) {
      Swal.fire("No se puede eliminar", mensajeError(error, "No se pudo eliminar el rol"), "error");
    }
  };

  const permisosTemplate = (rol: Rol) => {
    if (rol.administrador) return <Tag value="Todos los permisos" severity="success" />;
    const cantidad = Object.values(rol.permisos).reduce((t, as) => t + as.length, 0);
    return (
      <span className="text-color-secondary">
        {cantidad} de {totalPermisos} permisos · {Object.keys(rol.permisos).length} menú(s)
      </span>
    );
  };

  const accionesTemplate = (rol: Rol) => (
    <div className="flex gap-1">
      {rol.administrador || !puede("ROLES", "EDITAR") ? (
        <Button icon="pi pi-eye" rounded text tooltip="Ver permisos" onClick={() => abrir(rol, true)} />
      ) : (
        <Button icon="pi pi-pencil" rounded text tooltip="Editar" onClick={() => abrir(rol)} />
      )}
      {!rol.administrador && puede("ROLES", "ELIMINAR") && (
        <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" onClick={() => eliminar(rol)} />
      )}
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Roles y permisos</h2>
          <small className="text-color-secondary">
            Qué puede hacer cada rol en cada pantalla. Los roles son los mismos para todas las empresas.
          </small>
        </div>
        {puede("ROLES", "CREAR") && <Button label="Nuevo Rol" icon="pi pi-plus" severity="success" onClick={() => abrir(null)} />}
      </div>

      <DataTable value={roles} loading={loading} size="small" stripedRows showGridlines emptyMessage="No hay roles">
        <Column
          header="Rol"
          body={(r: Rol) => (
            <span>
              <span className="font-semibold">{r.nombre}</span>
              {r.administrador && <Tag value="Administrador" severity="info" className="ml-2" />}
              {r.descripcion && (
                <>
                  <br />
                  <small className="text-color-secondary">{r.descripcion}</small>
                </>
              )}
            </span>
          )}
        />
        <Column header="Permisos" body={permisosTemplate} />
        <Column header="Usuarios" field="usuarios" style={{ width: 110 }} />
        <Column header="Acciones" body={accionesTemplate} style={{ width: 110 }} />
      </DataTable>

      <Dialog
        header={editando ? `Rol ${editando.nombre}` : "Nuevo Rol"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "980px", maxWidth: "96vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="grid">
          <div className="col-12 md:col-4">
            <label>Nombre *</label>
            <InputText
              className="w-full"
              maxLength={60}
              disabled={soloLectura}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="col-12 md:col-8">
            <label>Descripción</label>
            <InputText
              className="w-full"
              maxLength={250}
              disabled={soloLectura}
              placeholder="Ej.: Factura y cobra en caja, sin acceso a configuración"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
        </div>

        {editando?.administrador && (
          <small className="text-color-secondary block mb-2">
            El rol administrador tiene todos los permisos, también los de pantallas nuevas, y no se edita.
          </small>
        )}
        {!soloLectura && !esAdministrador && (
          <small className="text-color-secondary block mb-2">
            Sólo podés otorgar permisos que tu rol tiene; los demás aparecen deshabilitados.
          </small>
        )}

        <div style={{ maxHeight: "58vh", overflowY: "auto" }}>
          {catalogo.map((grupo) => {
            const acciones = [...new Map(grupo.menus.flatMap((m) => m.acciones).map((a) => [a.codigo, a])).values()];
            return (
              <div key={grupo.grupo} className="mb-3">
                <div className="font-semibold mb-1">{grupo.grupo}</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--surface-border)" }}>
                        <th style={{ textAlign: "left", padding: "4px 6px", minWidth: 200 }}>Pantalla</th>
                        {!soloLectura && <th style={{ padding: "4px 6px", width: 50 }}>Todo</th>}
                        {acciones.map((a) => (
                          <th key={a.codigo} style={{ padding: "4px 6px", fontWeight: 500 }}>{a.nombre}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.menus.map((menu) => {
                        const codigos = menu.acciones.map((a) => a.codigo);
                        const todas = codigos.every((a) => form.permisos.has(clave(menu.codigo, a)));
                        return (
                          <tr key={menu.codigo} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                            <td style={{ padding: "4px 6px" }}>{menu.nombre}</td>
                            {!soloLectura && (
                              <td style={{ textAlign: "center" }}>
                                <Checkbox checked={todas} onChange={(e) => alternarMenu(menu.codigo, codigos, !!e.checked)} />
                              </td>
                            )}
                            {acciones.map((a) => (
                              <td key={a.codigo} style={{ textAlign: "center", padding: "4px 6px" }}>
                                {codigos.includes(a.codigo) ? (
                                  <Checkbox
                                    checked={!!editando?.administrador || form.permisos.has(clave(menu.codigo, a.codigo))}
                                    disabled={soloLectura || !otorgable(menu.codigo, a.codigo)}
                                    onChange={(e) => alternar(menu.codigo, a.codigo, !!e.checked)}
                                  />
                                ) : (
                                  <span className="text-color-secondary">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-content-between align-items-center mt-3">
          <small className="text-color-secondary">
            {editando?.administrador ? totalPermisos : form.permisos.size} de {totalPermisos} permisos
          </small>
          <div className="flex gap-2">
            <Button label={soloLectura ? "Cerrar" : "Cancelar"} severity="secondary" outlined onClick={() => setOpen(false)} />
            {!soloLectura && <Button label="Guardar" icon="pi pi-check" loading={guardando} onClick={guardar} />}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
