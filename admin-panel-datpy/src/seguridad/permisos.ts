import { matchPath } from "react-router-dom";

/** Mismo catálogo que el back (seguridad.Menu / seguridad.Accion). */
export type Menu =
  | "DASHBOARD" | "DOCUMENTOS_ELECTRONICOS"
  | "PERSONAS" | "PROVEEDORES" | "BANCOS" | "EMPRESA" | "COTIZACIONES" | "CANALES_VENTA" | "VENDEDORES"
  | "CARGOS" | "CONDICIONES_VENTA" | "TIMBRADOS" | "PUNTOS_EXPEDICION" | "FIRMADOR_TENANTS" | "USUARIOS" | "ROLES"
  | "PRODUCTOS" | "MARCAS" | "FAMILIAS" | "SUBFAMILIAS" | "COLORES" | "TALLES" | "SELECTOR_PRODUCTO"
  | "FACTURAS" | "NOTAS_CREDITO" | "NOTAS_DEBITO" | "AUTOFACTURAS" | "NOTAS_REMISION" | "APERTURA_CAJA" | "CIERRE_CAJA"
  | "CC_CLIENTES" | "CC_PROVEEDORES"
  | "STOCK" | "TRANSFERENCIAS" | "DEPOSITOS"
  | "REPORTE_VENTAS";

export type Accion =
  | "LISTAR" | "VER" | "CREAR" | "EDITAR" | "ELIMINAR" | "PDF" | "EXCEL" | "XML" | "SIFEN"
  | "ANULAR" | "INUTILIZAR" | "CERRAR" | "COBRAR" | "APROBAR";

/** Lo que devuelve el back en el login y en /api/users/me. */
export interface PermisosUsuario {
  rolId: string | null;
  rolNombre: string | null;
  administrador: boolean;
  /** menú -> acciones permitidas. */
  permisos: Record<string, string[]>;
}

export type Requisito = [Menu, Accion];

/**
 * Qué permiso exige cada pantalla (alcanza con uno). Lo usan el menú lateral, para mostrar sólo
 * lo permitido, y el layout, para no dejar entrar por URL. Las rutas que no figuran (perfil)
 * son para cualquier usuario logueado.
 */
export const PERMISO_POR_RUTA: [string, Requisito[]][] = [
  ["/dashboard", [["DASHBOARD", "VER"]]],
  ["/documentos-electronicos", [["DOCUMENTOS_ELECTRONICOS", "LISTAR"]]],
  ["/personas", [["PERSONAS", "LISTAR"]]],
  ["/proveedores", [["PROVEEDORES", "LISTAR"]]],
  ["/bancos", [["BANCOS", "LISTAR"]]],
  ["/empresa", [["EMPRESA", "VER"]]],
  ["/cotizaciones", [["COTIZACIONES", "LISTAR"]]],
  ["/canales-venta", [["CANALES_VENTA", "LISTAR"]]],
  ["/vendedores", [["VENDEDORES", "LISTAR"]]],
  ["/cargos", [["CARGOS", "LISTAR"]]],
  ["/condiciones-venta", [["CONDICIONES_VENTA", "LISTAR"]]],
  ["/timbrados", [["TIMBRADOS", "LISTAR"]]],
  ["/puntos-expedicion", [["PUNTOS_EXPEDICION", "LISTAR"]]],
  ["/firmador-tenants", [["FIRMADOR_TENANTS", "LISTAR"]]],
  ["/usuarios", [["USUARIOS", "LISTAR"]]],
  ["/roles", [["ROLES", "LISTAR"]]],
  ["/productos", [["PRODUCTOS", "LISTAR"]]],
  ["/marcas", [["MARCAS", "LISTAR"]]],
  ["/familias", [["FAMILIAS", "LISTAR"]]],
  ["/sub-familias", [["SUBFAMILIAS", "LISTAR"]]],
  ["/colores", [["COLORES", "LISTAR"]]],
  ["/talles", [["TALLES", "LISTAR"]]],
  ["/seleccion-producto", [["SELECTOR_PRODUCTO", "LISTAR"]]],
  ["/facturacion", [["FACTURAS", "LISTAR"]]],
  ["/facturacion-create", [["FACTURAS", "CREAR"]]],
  ["/facturacion-edit/:id", [["FACTURAS", "EDITAR"]]],
  ["/notas-credito", [["NOTAS_CREDITO", "LISTAR"]]],
  ["/nota-credito-create", [["NOTAS_CREDITO", "CREAR"]]],
  ["/notas-debito", [["NOTAS_DEBITO", "LISTAR"]]],
  ["/nota-debito-create", [["NOTAS_DEBITO", "CREAR"]]],
  ["/autofacturas", [["AUTOFACTURAS", "LISTAR"]]],
  ["/autofactura-create", [["AUTOFACTURAS", "CREAR"]]],
  ["/notas-remision", [["NOTAS_REMISION", "LISTAR"]]],
  ["/nota-remision-create", [["NOTAS_REMISION", "CREAR"]]],
  ["/apertura-caja", [["APERTURA_CAJA", "LISTAR"]]],
  ["/cierre-caja", [["CIERRE_CAJA", "VER"]]],
  ["/cuenta-corriente/clientes", [["CC_CLIENTES", "LISTAR"]]],
  ["/cuenta-corriente/proveedores", [["CC_PROVEEDORES", "LISTAR"]]],
  ["/stock/transferencias", [["TRANSFERENCIAS", "LISTAR"]]],
  ["/stock", [["STOCK", "LISTAR"]]],
  ["/depositos", [["DEPOSITOS", "LISTAR"]]],
  ["/ventas", [["REPORTE_VENTAS", "LISTAR"]]],
  ["/paises", [["PERSONAS", "LISTAR"]]],
  ["/departamentos", [["PERSONAS", "LISTAR"]]],
  ["/distritos", [["PERSONAS", "LISTAR"]]],
  ["/ciudades", [["PERSONAS", "LISTAR"]]]
];

export const tienePermiso = (permisos: PermisosUsuario | null | undefined, menu: Menu, accion: Accion) =>
  !!permisos && (permisos.administrador || (permisos.permisos[menu] ?? []).includes(accion));

/** Requisitos de una ruta; null si no exige permiso (o no está en el mapa). */
export const requisitosDeRuta = (pathname: string): Requisito[] | null =>
  PERMISO_POR_RUTA.find(([patron]) => matchPath({ path: patron, end: true }, pathname))?.[1] ?? null;

export const puedeEntrar = (permisos: PermisosUsuario | null | undefined, pathname: string) => {
  const requisitos = requisitosDeRuta(pathname);
  return !requisitos || requisitos.some(([m, a]) => tienePermiso(permisos, m, a));
};
