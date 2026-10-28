import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useUsaCaja } from "../hooks/useUsaCaja";
import { usePermisos } from "../hooks/usePermisos";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  collapsed: boolean;
  active?: boolean;
  expandable?: boolean;
  open?: boolean;
  onClick: () => void;
}

interface SubItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

type MenuKey = "config" | "productos" | "facturacion" | "cuentaCorriente" | "stock" | "reportes";

/** Rutas (prefijos) de cada sección: se abre la sección de la pantalla actual. */
const RUTAS_POR_MENU: [MenuKey, string[]][] = [
  ["config", ["/personas", "/proveedores", "/bancos", "/pais", "/departamentos", "/distritos", "/ciudades", "/empresa",
    "/cotizaciones", "/firmador-tenants", "/canales-venta", "/vendedores", "/cargos", "/condiciones-venta",
    "/timbrados", "/puntos-expedicion"]],
  ["productos", ["/productos", "/marcas", "/familias", "/sub-familias", "/colores", "/talles", "/seleccion-producto"]],
  ["facturacion", ["/facturacion", "/notas-credito", "/nota-credito-create", "/notas-debito", "/nota-debito-create",
    "/autofacturas", "/autofactura-create", "/notas-remision", "/nota-remision-create", "/apertura-caja", "/cierre-caja"]],
  ["cuentaCorriente", ["/cuenta-corriente"]],
  ["stock", ["/stock", "/depositos"]],
  ["reportes", ["/ventas"]]
];

const menuDeRuta = (pathname: string): MenuKey | null =>
  RUTAS_POR_MENU.find(([, rutas]) => rutas.some((r) => pathname.startsWith(r)))?.[0] ?? null;

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(() => menuDeRuta(location.pathname));
  // Al cambiar de pantalla se abre su sección (se ajusta en el render, sin efecto: patrón de React
  // para derivar estado de un valor anterior). Abrir/cerrar a mano se respeta hasta navegar.
  const [rutaAnterior, setRutaAnterior] = useState(location.pathname);
  if (rutaAnterior !== location.pathname) {
    setRutaAnterior(location.pathname);
    const menu = menuDeRuta(location.pathname);
    if (menu) setOpenMenu(menu);
  }
  // Sin apertura y cierre de caja (Control de caja de la empresa) esos menús no se muestran.
  const usaCaja = useUsaCaja();

  // Sólo se muestra lo que el rol permite (mismo mapa que protege las rutas en el layout).
  const { puedeRuta: ver } = usePermisos();
  const RUTAS_SECCION: Record<MenuKey, string[]> = {
    config: ["/personas", "/proveedores", "/bancos", "/empresa", "/cotizaciones", "/canales-venta", "/vendedores", "/cargos", "/condiciones-venta", "/timbrados", "/puntos-expedicion", "/usuarios", "/roles", "/firmador-tenants"],
    productos: ["/productos", "/marcas", "/familias", "/sub-familias", "/colores", "/seleccion-producto", "/talles"],
    facturacion: ["/facturacion", "/notas-credito", "/notas-debito", "/autofacturas", "/notas-remision", "/apertura-caja", "/cierre-caja"],
    cuentaCorriente: ["/cuenta-corriente/clientes", "/cuenta-corriente/proveedores"],
    stock: ["/stock", "/stock/transferencias", "/depositos"],
    reportes: ["/ventas"]
  };
  const seccionVisible = (key: MenuKey) => RUTAS_SECCION[key].some(ver);

  const toggleMenu = (key: MenuKey) => {
    setOpenMenu((prev) => (prev === key ? null : key));
  };

  const handleLogout = async () => {
    await logout();
  };

  const go = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const isCollapsed = isMobile ? false : collapsed;

  const sidebarContent = (
    <aside
      style={{
        width: isCollapsed ? 80 : 240,
        background: "#0f2747",
        borderRight: "1px solid #14315a",
        height: "100%",
        overflowY: "auto",
        color: "#d6e4ff",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }}
    >
      <div
        style={{
          padding: "20px",
          fontWeight: 600,
          fontSize: 16,
          textAlign: isCollapsed ? "center" : "left",
          borderBottom: "1px solid #14315a"
        }}
      >
        {isCollapsed ? "SA" : "Sistema Administrativo"}
      </div>

      {ver("/dashboard") && (
      <MenuItem
        icon="pi pi-th-large"
        label="Dashboard"
        collapsed={isCollapsed}
        active={isActive("/dashboard")}
        onClick={() => go("/dashboard")}
      />
      )}

      {ver("/documentos-electronicos") && (
      <MenuItem
        icon="pi pi-file"
        label="Documentos Electrónicos"
        collapsed={isCollapsed}
        active={isActive("/documentos-electronicos")}
        onClick={() => go("/documentos-electronicos")}
      />
      )}

      {seccionVisible("config") && (
      <>
      <MenuItem
        icon="pi pi-cog"
        label="Configuraciones"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "config"}
        active={
          isActive("/personas") ||
          isActive("/pais") ||
          isActive("/departamentos") ||
          isActive("/distritos") ||
          isActive("/ciudades") ||
          isActive("/empresa") ||
          isActive("/cotizaciones") ||
          isActive("/firmador-tenants") ||
          isActive("/usuarios") ||
          isActive("/roles") ||
          isActive("/canales-venta") ||
          isActive("/vendedores") ||
          isActive("/cargos") ||
          isActive("/condiciones-venta") ||
          isActive("/timbrados") ||
          isActive("/puntos-expedicion")
        }
        onClick={() => toggleMenu("config")}
      />

      {openMenu === "config" && !isCollapsed && (
        <>
          {ver("/personas") && (
          <SubItem
            icon="pi pi-users"
            label="Personas"
            active={isActive("/personas")}
            onClick={() => go("/personas")}
          />
          )}
          {ver("/proveedores") && (
          <SubItem
            icon="pi pi-users"
            label="Proveedores"
            active={isActive("/proveedores")}
            onClick={() => go("/proveedores")}
          />
          )}
          {ver("/bancos") && (
          <SubItem
            icon="pi pi-users"
            label="Bancos"
            active={isActive("/bancos")}
            onClick={() => go("/bancos")}
          />
          )}
          {ver("/empresa") && (
          <SubItem
            icon="pi pi-building"
            label="Datos de la empresa"
            active={isActive("/empresa")}
            onClick={() => go("/empresa")}
          />
          )}
          {ver("/cotizaciones") && (
          <SubItem
            icon="pi pi-dollar"
            label="Cotizaciones"
            active={isActive("/cotizaciones")}
            onClick={() => go("/cotizaciones")}
          />
          )}
          {ver("/canales-venta") && (
          <SubItem icon="pi pi-send" label="Canales de Venta" active={isActive("/canales-venta")} onClick={() => go("/canales-venta")} />
          )}
          {ver("/vendedores") && (
          <SubItem icon="pi pi-id-card" label="Vendedores" active={isActive("/vendedores")} onClick={() => go("/vendedores")} />
          )}
          {ver("/cargos") && (
          <SubItem icon="pi pi-briefcase" label="Cargos" active={isActive("/cargos")} onClick={() => go("/cargos")} />
          )}
          {ver("/condiciones-venta") && (
          <SubItem icon="pi pi-money-bill" label="Condiciones de Venta" active={isActive("/condiciones-venta")} onClick={() => go("/condiciones-venta")} />
          )}
          {ver("/timbrados") && (
          <SubItem icon="pi pi-verified" label="Timbrados" active={isActive("/timbrados")} onClick={() => go("/timbrados")} />
          )}
          {ver("/puntos-expedicion") && (
          <SubItem icon="pi pi-map-marker" label="Puntos de Expedición" active={isActive("/puntos-expedicion")} onClick={() => go("/puntos-expedicion")} />
          )}
          {ver("/usuarios") && (
          <SubItem icon="pi pi-user-edit" label="Usuarios" active={isActive("/usuarios")} onClick={() => go("/usuarios")} />
          )}
          {ver("/roles") && (
          <SubItem icon="pi pi-key" label="Roles y permisos" active={isActive("/roles")} onClick={() => go("/roles")} />
          )}
          {ver("/firmador-tenants") && (
          <SubItem
            icon="pi pi-shield"
            label="Tenants firmador-xml"
            active={isActive("/firmador-tenants")}
            onClick={() => go("/firmador-tenants")}
          />
          )}
        </>
      )}
      </>
      )}

      {seccionVisible("productos") && (
      <>
      <MenuItem
        icon="pi pi-box"
        label="Conf. Productos"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "productos"}
        active={
          isActive("/productos") ||
          isActive("/marcas") ||
          isActive("/familias") ||
          isActive("/sub-familias") ||
          isActive("/colores") ||
          isActive("/talles")
        }
        onClick={() => toggleMenu("productos")}
      />

      {openMenu === "productos" && !isCollapsed && (
        <>
          {ver("/productos") && (
          <SubItem icon="pi pi-box" label="Productos" active={isActive("/productos")} onClick={() => go("/productos")} />
          )}
          {ver("/marcas") && (
          <SubItem icon="pi pi-bookmark" label="Marcas" active={isActive("/marcas")} onClick={() => go("/marcas")} />
          )}
          {ver("/familias") && (
          <SubItem icon="pi pi-sitemap" label="Familias" active={isActive("/familias")} onClick={() => go("/familias")} />
          )}
          {ver("/sub-familias") && (
          <SubItem icon="pi pi-share-alt" label="Sub-Familias" active={isActive("/sub-familias")} onClick={() => go("/sub-familias")} />
          )}
          {ver("/colores") && (
          <SubItem icon="pi pi-palette" label="Colores" active={isActive("/colores")} onClick={() => go("/colores")} />
          )}
          {ver("/seleccion-producto") && (
          <SubItem icon="pi pi-check-square" label="Selector Producto" active={isActive("/seleccion-producto")} onClick={() => go("/seleccion-producto")} />
          )}
          {ver("/talles") && (
          <SubItem icon="pi pi-hashtag" label="Talles" active={isActive("/talles")} onClick={() => go("/talles")} />
          )}
        </>
      )}
      </>
      )}

      {seccionVisible("facturacion") && (
      <>
      <MenuItem
        icon="pi pi-wallet"
        label="Facturación"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "facturacion"}
        active={
          isActive("/facturacion") ||
          isActive("/facturacion-create") ||
          isActive("/notas-credito") ||
          isActive("/nota-credito-create") ||
          isActive("/notas-debito") ||
          isActive("/nota-debito-create") ||
          isActive("/autofacturas") ||
          isActive("/autofactura-create") ||
          isActive("/notas-remision") ||
          isActive("/nota-remision-create") ||
          isActive("/apertura-caja") ||
          isActive("/cierre-caja")
        }
        onClick={() => toggleMenu("facturacion")}
      />

      {openMenu === "facturacion" && !isCollapsed && (
        <>
          {ver("/facturacion") && (
          <SubItem icon="pi pi-receipt" label="Facturación" active={isActive("/facturacion") || isActive("/facturacion-create")} onClick={() => go("/facturacion")} />
          )}
          {ver("/notas-credito") && (
          <SubItem icon="pi pi-replay" label="Notas de Crédito" active={isActive("/notas-credito") || isActive("/nota-credito-create")} onClick={() => go("/notas-credito")} />
          )}
          {ver("/notas-debito") && (
          <SubItem icon="pi pi-plus-circle" label="Notas de Débito" active={isActive("/notas-debito") || isActive("/nota-debito-create")} onClick={() => go("/notas-debito")} />
          )}
          {ver("/autofacturas") && (
          <SubItem icon="pi pi-shopping-bag" label="Autofacturas" active={isActive("/autofacturas") || isActive("/autofactura-create")} onClick={() => go("/autofacturas")} />
          )}
          {ver("/notas-remision") && (
          <SubItem icon="pi pi-truck" label="Notas de Remisión" active={isActive("/notas-remision") || isActive("/nota-remision-create")} onClick={() => go("/notas-remision")} />
          )}
          {usaCaja && (
            <>
              {ver("/apertura-caja") && (
              <SubItem icon="pi pi-play-circle" label="Apertura Caja" active={isActive("/apertura-caja")} onClick={() => go("/apertura-caja")} />
              )}
              {ver("/cierre-caja") && (
              <SubItem icon="pi pi-stop-circle" label="Cierre Caja" active={isActive("/cierre-caja")} onClick={() => go("/cierre-caja")} />
              )}
            </>
          )}
        </>
      )}
      </>
      )}

      {seccionVisible("cuentaCorriente") && (
      <>
      <MenuItem
        icon="pi pi-credit-card"
        label="Cuenta Corrientes"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "cuentaCorriente"}
        active={isActive("/cuenta-corriente/clientes") || isActive("/cuenta-corriente/proveedores")}
        onClick={() => toggleMenu("cuentaCorriente")}
      />

      {openMenu === "cuentaCorriente" && !isCollapsed && (
        <>
          {ver("/cuenta-corriente/clientes") && (
          <SubItem icon="pi pi-users" label="Clientes" active={isActive("/cuenta-corriente/clientes")} onClick={() => go("/cuenta-corriente/clientes")} />
          )}
          {ver("/cuenta-corriente/proveedores") && (
          <SubItem icon="pi pi-briefcase" label="Proveedores" active={isActive("/cuenta-corriente/proveedores")} onClick={() => go("/cuenta-corriente/proveedores")} />
          )}
        </>
      )}
      </>
      )}

      {seccionVisible("stock") && (
      <>
      <MenuItem
        icon="pi pi-database"
        label="Stock"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "stock"}
        active={isActive("/stock") || isActive("/stock/transferencias") || isActive("/depositos")}
        onClick={() => toggleMenu("stock")}
      />

      {openMenu === "stock" && !isCollapsed && (
        <>
          {ver("/stock") && (
          <SubItem icon="pi pi-database" label="Stock" active={isActive("/stock")} onClick={() => go("/stock")} />
          )}
          {ver("/stock/transferencias") && (
          <SubItem icon="pi pi-arrow-right-arrow-left" label="Transferencias" active={isActive("/stock/transferencias")} onClick={() => go("/stock/transferencias")} />
          )}
          {ver("/depositos") && (
          <SubItem icon="pi pi-warehouse" label="Depósitos" active={isActive("/depositos")} onClick={() => go("/depositos")} />
          )}
        </>
      )}
      </>
      )}

      {seccionVisible("reportes") && (
      <>
      <MenuItem
        icon="pi pi-chart-line"
        label="Reportes"
        collapsed={isCollapsed}
        expandable
        open={openMenu === "reportes"}
        active={isActive("/ventas")}
        onClick={() => toggleMenu("reportes")}
      />

      {openMenu === "reportes" && !isCollapsed && (
        <>
          {ver("/ventas") && (
          <SubItem icon="pi pi-chart-bar" label="Ventas" active={isActive("/ventas")} onClick={() => go("/ventas")} />
          )}
        </>
      )}
      </>
      )}

      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #14315a",
          padding: isCollapsed ? "16px 0" : "16px 20px"
        }}
      >
        <div
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#ff6b6b" }}
        >
          <i className="pi pi-sign-out" style={{ fontSize: 16, width: 28 }} />
          {!isCollapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999
            }}
          />
        )}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100%",
            zIndex: 1000,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform .25s ease"
          }}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}

function MenuItem({ icon, label, collapsed, active, expandable, open, onClick }: MenuItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: collapsed ? "14px" : "14px 22px",
        cursor: "pointer",
        background: active ? "#1e4f8a" : "transparent",
        borderLeft: active ? "3px solid #4fd1ff" : "3px solid transparent",
        transition: "all .15s"
      }}
    >
      <i className={icon} style={{ fontSize: 16, width: 28, color: "#4fd1ff" }} />
      {!collapsed && (
        <>
          <span style={{ fontSize: 14 }}>{label}</span>
          {expandable && (
            <i
              className={open ? "pi pi-chevron-up" : "pi pi-chevron-down"}
              style={{ marginLeft: "auto", fontSize: 12 }}
            />
          )}
        </>
      )}
    </div>
  );
}

function SubItem({ icon, label, active, onClick }: SubItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 48px",
        cursor: "pointer",
        color: active ? "#ffffff" : "#c7d7ff",
        background: active ? "rgba(79, 209, 255, 0.12)" : "transparent",
        borderLeft: active ? "3px solid #4fd1ff" : "3px solid transparent",
        transition: "all .15s"
      }}
    >
      <i className={icon} style={{ width: 24, color: "#4fd1ff" }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}
