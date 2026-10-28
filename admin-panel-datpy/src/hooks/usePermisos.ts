import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { puedeEntrar, tienePermiso, type Accion, type Menu, type PermisosUsuario } from "../seguridad/permisos";

/**
 * Permisos del usuario logueado (rol + menú/acción). Ocultar en el front es comodidad: el back
 * valida cada request igual.
 */
export function usePermisos() {
  const { user } = useAuth();
  const permisos = (user?.permisos ?? null) as PermisosUsuario | null;

  const puede = useCallback((menu: Menu, accion: Accion) => tienePermiso(permisos, menu, accion), [permisos]);
  const puedeRuta = useCallback((pathname: string) => puedeEntrar(permisos, pathname), [permisos]);

  return { puede, puedeRuta, esAdministrador: !!permisos?.administrador, rolNombre: permisos?.rolNombre ?? null };
}
