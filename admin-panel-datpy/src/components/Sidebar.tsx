import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function Sidebar({ collapsed }: Props) {

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path;

  const [openConfig, setOpenConfig] = useState(true);
  const [openFacturacion, setOpenFacturacion] = useState(false);
  const [openReportes, setOpenReportes] = useState(false);

  return (

    <aside
      style={{
        width: collapsed ? 80 : 240,
        transition: "width .25s",
        background: "#0f2747",
        borderRight: "1px solid #14315a",
        height: "100%",
        overflowY: "auto",
        color: "#d6e4ff"
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
        icon="pi pi-home"
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
        onClick={() => setOpenConfig(!openConfig)}
      />

      {openConfig && !collapsed && (
        <>
          <SubItem icon="pi pi-box" label="Productos" onClick={() => navigate("/productos")} />
          <SubItem icon="pi pi-tags" label="Marcas" onClick={() => navigate("/marcas")} />
          <SubItem icon="pi pi-tags" label="Familias" onClick={() => navigate("/familias")} />
          <SubItem icon="pi pi-tags" label="Colores" onClick={() => navigate("/colores")} />
          <SubItem icon="pi pi-tags" label="Talles" onClick={() => navigate("/talles")} />
        </>
      )}

      <MenuItem
        icon="pi pi-file"
        label="Facturación"
        collapsed={collapsed}
        expandable
        open={openFacturacion}
        onClick={() => setOpenFacturacion(!openFacturacion)}
      />

      {openFacturacion && !collapsed && (
        <>
          <SubItem icon="pi pi-receipt" label="Facturación" onClick={() => navigate("/facturacion")} />
          <SubItem icon="pi pi-play" label="Apertura Caja" onClick={() => navigate("/apertura-caja")} />
          <SubItem icon="pi pi-stop" label="Cierre Caja" onClick={() => navigate("/cierre-caja")} />
        </>
      )}

      <MenuItem
        icon="pi pi-chart-bar"
        label="Reportes"
        collapsed={collapsed}
        expandable
        open={openReportes}
        onClick={() => setOpenReportes(!openReportes)}
      />

      {openReportes && !collapsed && (
        <>
          <SubItem icon="pi pi-chart-line" label="Ventas" onClick={() => navigate("/ventas")} />
          <SubItem icon="pi pi-database" label="Stock" onClick={() => navigate("/stock")} />
        </>
      )}

    </aside>

  );

}

function MenuItem({ icon, label, collapsed, active, expandable, open, onClick }: any) {

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
          <span style={{ fontSize: 14 }}>
            {label}
          </span>

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

function SubItem({ icon, label, onClick }: any) {

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 48px",
        cursor: "pointer",
        color: "#c7d7ff"
      }}
    >

      <i className={icon} style={{ width: 24, color: "#4fd1ff" }} />

      <span style={{ fontSize: 13 }}>
        {label}
      </span>

    </div>
  );

}