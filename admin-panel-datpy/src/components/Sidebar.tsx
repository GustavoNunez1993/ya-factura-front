import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

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

  const [openConfig, setOpenConfig] = useState(true);
  const [openFacturacion, setOpenFacturacion] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);
  const [openProductos, setOpenProductos] = useState(false);
  const [openCuentaCorriente, setOpenCuentaCorriente] = useState(false);

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

      <MenuItem
        icon="pi pi-th-large"
        label="Dashboard"
        collapsed={isCollapsed}
        active={isActive("/dashboard")}
        onClick={() => go("/dashboard")}
      />

      <MenuItem
        icon="pi pi-cog"
        label="Configuraciones"
        collapsed={isCollapsed}
        expandable
        open={openConfig}
        active={
          isActive("/personas") ||
          isActive("/pais") ||
          isActive("/departamentos") ||
          isActive("/distritos") ||
          isActive("/ciudades")
        }
        onClick={() => setOpenConfig(!openConfig)}
      />

      {openConfig && !isCollapsed && (
        <>
          <SubItem
            icon="pi pi-users"
            label="Personas"
            active={isActive("/personas")}
            onClick={() => go("/personas")}
          />
          <SubItem
            icon="pi pi-users"
            label="Proveedores"
            active={isActive("/proveedores")}
            onClick={() => go("/proveedores")}
          />
          <SubItem
            icon="pi pi-users"
            label="Bancos"
            active={isActive("/bancos")}
            onClick={() => go("/bancos")}
          />
        </>
      )}

      <MenuItem
        icon="pi pi-box"
        label="Conf. Productos"
        collapsed={isCollapsed}
        expandable
        open={openProductos}
        active={
          isActive("/productos") ||
          isActive("/marcas") ||
          isActive("/familias") ||
          isActive("/sub-familias") ||
          isActive("/colores") ||
          isActive("/talles")
        }
        onClick={() => setOpenProductos(!openProductos)}
      />

      {openProductos && !isCollapsed && (
        <>
          <SubItem icon="pi pi-box" label="Productos" active={isActive("/productos")} onClick={() => go("/productos")} />
          <SubItem icon="pi pi-bookmark" label="Marcas" active={isActive("/marcas")} onClick={() => go("/marcas")} />
          <SubItem icon="pi pi-sitemap" label="Familias" active={isActive("/familias")} onClick={() => go("/familias")} />
          <SubItem icon="pi pi-share-alt" label="Sub-Familias" active={isActive("/sub-familias")} onClick={() => go("/sub-familias")} />
          <SubItem icon="pi pi-palette" label="Colores" active={isActive("/colores")} onClick={() => go("/colores")} />
          <SubItem icon="pi pi-check-square" label="Selector Producto" active={isActive("/seleccion-producto")} onClick={() => go("/seleccion-producto")} />
          <SubItem icon="pi pi-hashtag" label="Talles" active={isActive("/talles")} onClick={() => go("/talles")} />
        </>
      )}

      <MenuItem
        icon="pi pi-wallet"
        label="Facturación"
        collapsed={isCollapsed}
        expandable
        open={openFacturacion}
        active={
          isActive("/facturacion") ||
          isActive("/apertura-caja") ||
          isActive("/cierre-caja") ||
          isActive("/canales-venta") ||
          isActive("/vendedores") ||
          isActive("/cargos")
        }
        onClick={() => setOpenFacturacion(!openFacturacion)}
      />

      {openFacturacion && !isCollapsed && (
        <>
          <SubItem icon="pi pi-receipt" label="Facturación" active={isActive("/facturacion")} onClick={() => go("/facturacion")} />
          <SubItem icon="pi pi-play-circle" label="Apertura Caja" active={isActive("/apertura-caja")} onClick={() => go("/apertura-caja")} />
          <SubItem icon="pi pi-stop-circle" label="Cierre Caja" active={isActive("/cierre-caja")} onClick={() => go("/cierre-caja")} />
          <SubItem icon="pi pi-send" label="Canales de Venta" active={isActive("/canales-venta")} onClick={() => go("/canales-venta")} />
          <SubItem icon="pi pi-id-card" label="Vendedores" active={isActive("/vendedores")} onClick={() => go("/vendedores")} />
          <SubItem icon="pi pi-briefcase" label="Cargos" active={isActive("/cargos")} onClick={() => go("/cargos")} />
        </>
      )}

      <MenuItem
        icon="pi pi-credit-card"
        label="Cuenta Corrientes"
        collapsed={isCollapsed}
        expandable
        open={openCuentaCorriente}
        active={isActive("/cuenta-corriente/clientes") || isActive("/cuenta-corriente/proveedores")}
        onClick={() => setOpenCuentaCorriente(!openCuentaCorriente)}
      />

      {openCuentaCorriente && !isCollapsed && (
        <>
          <SubItem icon="pi pi-users" label="Clientes" active={isActive("/cuenta-corriente/clientes")} onClick={() => go("/cuenta-corriente/clientes")} />
          <SubItem icon="pi pi-briefcase" label="Proveedores" active={isActive("/cuenta-corriente/proveedores")} onClick={() => go("/cuenta-corriente/proveedores")} />
        </>
      )}

      <MenuItem
        icon="pi pi-chart-line"
        label="Reportes"
        collapsed={isCollapsed}
        expandable
        open={openReportes}
        active={isActive("/ventas") || isActive("/stock")}
        onClick={() => setOpenReportes(!openReportes)}
      />

      {openReportes && !isCollapsed && (
        <>
          <SubItem icon="pi pi-chart-bar" label="Ventas" active={isActive("/ventas")} onClick={() => go("/ventas")} />
          <SubItem icon="pi pi-database" label="Stock" active={isActive("/stock")} onClick={() => go("/stock")} />
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
