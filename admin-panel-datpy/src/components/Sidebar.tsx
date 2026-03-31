import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

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

export default function Sidebar({ collapsed }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const [openConfig, setOpenConfig] = useState(true);
  const [openFacturacion, setOpenFacturacion] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);
  const [openProductos, setOpenProductos] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <aside
      style={{
        width: collapsed ? 80 : 240,
        transition: "width .25s",
        background: "#0f2747",
        borderRight: "1px solid #14315a",
        height: "100%",
        overflowY: "auto",
        color: "#d6e4ff",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div
        style={{
          padding: "20px",
          fontWeight: 600,
          fontSize: 16,
          textAlign: collapsed ? "center" : "left",
          borderBottom: "1px solid #14315a"
        }}
      >
        {collapsed ? "SA" : "Sistema Administrativo"}
      </div>

      <MenuItem
        icon="pi pi-th-large"
        label="Dashboard"
        collapsed={collapsed}
        active={isActive("/dashboard")}
        onClick={() => navigate("/dashboard")}
      />

      <MenuItem
        icon="pi pi-cog"
        label="Configuraciones"
        collapsed={collapsed}
        expandable
        open={openConfig}
        active={
          isActive("/clientes") ||
          isActive("/pais") ||
          isActive("/departamentos") ||
          isActive("/distritos") ||
          isActive("/ciudades")
        }
        onClick={() => setOpenConfig(!openConfig)}
      />

      {openConfig && !collapsed && (
        <>
          <SubItem
            icon="pi pi-users"
            label="Clientes"
            active={isActive("/clientes")}
            onClick={() => navigate("/clientes")}
          />
          <SubItem
            icon="pi pi-globe"
            label="Países"
            active={isActive("/paises")}
            onClick={() => navigate("/paises")}
          />
          <SubItem
            icon="pi pi-map"
            label="Departamentos"
            active={isActive("/departamentos")}
            onClick={() => navigate("/departamentos")}
          />
          <SubItem
            icon="pi pi-map-marker"
            label="Distritos"
            active={isActive("/distritos")}
            onClick={() => navigate("/distritos")}
          />
          <SubItem
            icon="pi pi-building"
            label="Ciudades"
            active={isActive("/ciudades")}
            onClick={() => navigate("/ciudades")}
          />
        </>
      )}

      <MenuItem
        icon="pi pi-box"
        label="Conf. Productos"
        collapsed={collapsed}
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

      {openProductos && !collapsed && (
        <>
          <SubItem
            icon="pi pi-box"
            label="Productos"
            active={isActive("/productos")}
            onClick={() => navigate("/productos")}
          />
          <SubItem
            icon="pi pi-bookmark"
            label="Marcas"
            active={isActive("/marcas")}
            onClick={() => navigate("/marcas")}
          />
          <SubItem
            icon="pi pi-sitemap"
            label="Familias"
            active={isActive("/familias")}
            onClick={() => navigate("/familias")}
          />
          <SubItem
            icon="pi pi-share-alt"
            label="Sub-Familias"
            active={isActive("/sub-familias")}
            onClick={() => navigate("/sub-familias")}
          />
          <SubItem
            icon="pi pi-palette"
            label="Colores"
            active={isActive("/colores")}
            onClick={() => navigate("/colores")}
          />
          <SubItem
            icon="pi pi-hashtag"
            label="Talles"
            active={isActive("/talles")}
            onClick={() => navigate("/talles")}
          />
        </>
      )}

      <MenuItem
        icon="pi pi-wallet"
        label="Facturación"
        collapsed={collapsed}
        expandable
        open={openFacturacion}
        active={
          isActive("/facturacion") ||
          isActive("/apertura-caja") ||
          isActive("/cierre-caja")
        }
        onClick={() => setOpenFacturacion(!openFacturacion)}
      />

      {openFacturacion && !collapsed && (
        <>
          <SubItem
            icon="pi pi-receipt"
            label="Facturación"
            active={isActive("/facturacion")}
            onClick={() => navigate("/facturacion")}
          />
          <SubItem
            icon="pi pi-play-circle"
            label="Apertura Caja"
            active={isActive("/apertura-caja")}
            onClick={() => navigate("/apertura-caja")}
          />
          <SubItem
            icon="pi pi-stop-circle"
            label="Cierre Caja"
            active={isActive("/cierre-caja")}
            onClick={() => navigate("/cierre-caja")}
          />
        </>
      )}

      <MenuItem
        icon="pi pi-chart-line"
        label="Reportes"
        collapsed={collapsed}
        expandable
        open={openReportes}
        active={isActive("/ventas") || isActive("/stock")}
        onClick={() => setOpenReportes(!openReportes)}
      />

      {openReportes && !collapsed && (
        <>
          <SubItem
            icon="pi pi-chart-bar"
            label="Ventas"
            active={isActive("/ventas")}
            onClick={() => navigate("/ventas")}
          />
          <SubItem
            icon="pi pi-database"
            label="Stock"
            active={isActive("/stock")}
            onClick={() => navigate("/stock")}
          />
        </>
      )}

      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #14315a",
          padding: collapsed ? "16px 0" : "16px 20px"
        }}
      >
        <div
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "#ff6b6b"
          }}
        >
          <i
            className="pi pi-sign-out"
            style={{
              fontSize: 16,
              width: 28
            }}
          />

          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
}

function MenuItem({
  icon,
  label,
  collapsed,
  active,
  expandable,
  open,
  onClick
}: MenuItemProps) {
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
      <i
        className={icon}
        style={{
          fontSize: 16,
          width: 28,
          color: "#4fd1ff"
        }}
      />

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
      <i
        className={icon}
        style={{
          width: 24,
          color: "#4fd1ff"
        }}
      />

      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}