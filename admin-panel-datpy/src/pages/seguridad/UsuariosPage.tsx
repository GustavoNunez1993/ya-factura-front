import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Tag } from "primereact/tag";

import { useAuth } from "../../context/AuthContext";
import { usePermisos } from "../../hooks/usePermisos";
import { SeguridadService, mensajeError, type Rol, type Usuario } from "../../services/SeguridadService";

interface Form {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rolId: string | null;
}

const formVacio: Form = { nombre: "", apellido: "", email: "", password: "", rolId: null };
const PASSWORD_MINIMA = 8;

/**
 * Usuarios de la empresa: alta (reemplaza al registro público), rol, activar/desactivar y
 * restablecer contraseña. Un usuario desactivado no puede iniciar sesión.
 */
export default function UsuariosPage() {
  const { user } = useAuth();
  const { puede, esAdministrador } = usePermisos();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [form, setForm] = useState<Form>(formVacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([
        SeguridadService.usuarios(),
        puede("USUARIOS", "CREAR") || puede("USUARIOS", "EDITAR") ? SeguridadService.roles() : Promise.resolve([])
      ]);
      setUsuarios(u);
      setRoles(r);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El rol administrador sólo lo asigna un administrador.
  const opcionesRol = roles
    .filter((r) => esAdministrador || !r.administrador)
    .map((r) => ({ label: r.administrador ? `${r.nombre} (todos los permisos)` : r.nombre, value: r.id }));

  const abrir = (usuario: Usuario | null) => {
    setEditando(usuario);
    setForm(
      usuario
        ? { nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email, password: "", rolId: usuario.rolId }
        : formVacio
    );
    setOpen(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim() || !form.rolId) {
      Swal.fire("Atención", "Complete nombre, apellido, email y rol", "warning");
      return;
    }
    if (!editando && form.password.length < PASSWORD_MINIMA) {
      Swal.fire("Atención", `La contraseña debe tener al menos ${PASSWORD_MINIMA} caracteres`, "warning");
      return;
    }
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      rolId: form.rolId,
      ...(editando ? {} : { password: form.password })
    };
    try {
      setGuardando(true);
      if (editando) await SeguridadService.actualizarUsuario(editando.id, payload);
      else await SeguridadService.crearUsuario(payload);
      Swal.fire("Listo", editando ? "Usuario actualizado" : "Usuario creado", "success");
      setOpen(false);
      cargar();
    } catch (error) {
      Swal.fire("Error", mensajeError(error, "No se pudo guardar el usuario"), "error");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (u: Usuario) => {
    const activar = !u.activo;
    const r = await Swal.fire({
      icon: "warning",
      title: `¿${activar ? "Activar" : "Desactivar"} a ${u.nombre} ${u.apellido}?`,
      text: activar ? "Podrá volver a iniciar sesión." : "No podrá iniciar sesión ni seguir usando el sistema.",
      showCancelButton: true,
      confirmButtonText: activar ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: activar ? "#16a34a" : "#dc2626"
    });
    if (!r.isConfirmed) return;
    try {
      await SeguridadService.cambiarEstadoUsuario(u.id, activar);
      cargar();
    } catch (error) {
      Swal.fire("Error", mensajeError(error, "No se pudo cambiar el estado"), "error");
    }
  };

  const restablecer = async (u: Usuario) => {
    const r = await Swal.fire({
      title: `Nueva contraseña para ${u.nombre} ${u.apellido}`,
      input: "password",
      inputPlaceholder: `Al menos ${PASSWORD_MINIMA} caracteres`,
      inputValidator: (v) => (!v || v.length < PASSWORD_MINIMA ? `Al menos ${PASSWORD_MINIMA} caracteres` : undefined),
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar"
    });
    if (!r.isConfirmed) return;
    try {
      await SeguridadService.restablecerPassword(u.id, String(r.value));
      Swal.fire("Listo", "Contraseña actualizada", "success");
    } catch (error) {
      Swal.fire("Error", mensajeError(error, "No se pudo cambiar la contraseña"), "error");
    }
  };

  // Un administrador sólo lo modifica otro administrador.
  const editable = (u: Usuario) => puede("USUARIOS", "EDITAR") && (esAdministrador || !u.administrador);

  const accionesTemplate = (u: Usuario) =>
    editable(u) ? (
      <div className="flex gap-1">
        <Button icon="pi pi-pencil" rounded text tooltip="Editar" onClick={() => abrir(u)} />
        <Button icon="pi pi-key" rounded text severity="warning" tooltip="Restablecer contraseña" onClick={() => restablecer(u)} />
        {u.id !== user?.id &&
          (u.activo ? (
            <Button icon="pi pi-ban" rounded text severity="danger" tooltip="Desactivar" onClick={() => cambiarEstado(u)} />
          ) : (
            <Button icon="pi pi-check" rounded text severity="success" tooltip="Activar" onClick={() => cambiarEstado(u)} />
          ))}
      </div>
    ) : null;

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Usuarios</h2>
          <small className="text-color-secondary">Usuarios de la empresa y el rol con el que trabaja cada uno</small>
        </div>
        {puede("USUARIOS", "CREAR") && (
          <Button label="Nuevo Usuario" icon="pi pi-plus" severity="success" onClick={() => abrir(null)} />
        )}
      </div>

      <DataTable value={usuarios} loading={loading} size="small" stripedRows showGridlines emptyMessage="No hay usuarios">
        <Column header="Nombre" body={(u: Usuario) => `${u.nombre} ${u.apellido}`} />
        <Column header="Email" field="email" />
        <Column
          header="Rol"
          body={(u: Usuario) => (
            <span>
              {u.rolNombre ?? "-"}
              {u.administrador && <Tag value="Admin" severity="info" className="ml-2" />}
            </span>
          )}
        />
        <Column
          header="Estado"
          body={(u: Usuario) => <Tag value={u.activo ? "Activo" : "Inactivo"} severity={u.activo ? "success" : "danger"} />}
          style={{ width: 110 }}
        />
        <Column header="Acciones" body={accionesTemplate} style={{ width: 150 }} />
      </DataTable>

      <Dialog
        header={editando ? `Usuario ${editando.nombre} ${editando.apellido}` : "Nuevo Usuario"}
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "520px", maxWidth: "95vw" }}
        onHide={() => setOpen(false)}
      >
        <div className="grid">
          <div className="col-6">
            <label>Nombre *</label>
            <InputText className="w-full" maxLength={100} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="col-6">
            <label>Apellido *</label>
            <InputText className="w-full" maxLength={100} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
          <div className="col-12">
            <label>Email *</label>
            <InputText className="w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          {!editando && (
            <div className="col-12">
              <label>Contraseña *</label>
              <Password
                className="w-full"
                inputClassName="w-full"
                toggleMask
                feedback={false}
                placeholder={`Al menos ${PASSWORD_MINIMA} caracteres`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          )}
          <div className="col-12">
            <label>Rol *</label>
            <Dropdown
              className="w-full"
              value={form.rolId}
              options={opcionesRol}
              placeholder="Seleccione rol"
              emptyMessage="No hay roles (créelos en Roles y permisos)"
              onChange={(e) => setForm({ ...form, rolId: e.value })}
            />
          </div>
        </div>
        <div className="flex justify-content-end gap-2 mt-3">
          <Button label="Cancelar" severity="secondary" outlined onClick={() => setOpen(false)} />
          <Button label="Guardar" icon="pi pi-check" loading={guardando} onClick={guardar} />
        </div>
      </Dialog>
    </div>
  );
}
