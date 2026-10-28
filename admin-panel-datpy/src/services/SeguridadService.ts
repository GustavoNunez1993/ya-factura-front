import api from "./api";

export interface AccionCatalogo {
  codigo: string;
  nombre: string;
}

export interface MenuCatalogo {
  codigo: string;
  nombre: string;
  acciones: AccionCatalogo[];
}

export interface GrupoCatalogo {
  grupo: string;
  menus: MenuCatalogo[];
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  administrador: boolean;
  usuarios: number;
  /** menú -> acciones */
  permisos: Record<string, string[]>;
}

export interface RolPayload {
  nombre: string;
  descripcion: string;
  permisos: Record<string, string[]>;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  rolId: string | null;
  rolNombre: string | null;
  administrador: boolean;
}

export interface UsuarioPayload {
  nombre: string;
  apellido: string;
  email: string;
  /** Sólo al crear. */
  password?: string;
  rolId: string;
}

/** Roles (globales) y usuarios de la empresa. */
export const SeguridadService = {
  async catalogo(): Promise<GrupoCatalogo[]> {
    return (await api.get("/roles/catalogo")).data;
  },
  async roles(): Promise<Rol[]> {
    return (await api.get("/roles")).data;
  },
  async crearRol(payload: RolPayload): Promise<Rol> {
    return (await api.post("/roles", payload)).data;
  },
  async actualizarRol(id: string, payload: RolPayload): Promise<Rol> {
    return (await api.put(`/roles/${id}`, payload)).data;
  },
  async eliminarRol(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  async usuarios(): Promise<Usuario[]> {
    return (await api.get("/usuarios")).data;
  },
  async crearUsuario(payload: UsuarioPayload): Promise<Usuario> {
    return (await api.post("/usuarios", payload)).data;
  },
  async actualizarUsuario(id: string, payload: UsuarioPayload): Promise<Usuario> {
    return (await api.put(`/usuarios/${id}`, payload)).data;
  },
  async cambiarEstadoUsuario(id: string, activo: boolean): Promise<Usuario> {
    return (await api.patch(`/usuarios/${id}/${activo ? "activar" : "desactivar"}`)).data;
  },
  async restablecerPassword(id: string, password: string): Promise<void> {
    await api.put(`/usuarios/${id}/password`, { password });
  }
};

export const mensajeError = (error: unknown, porDefecto: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto;
