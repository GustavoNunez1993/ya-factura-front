import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  ListItemIcon
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path;

  const [openConfig, setOpenConfig] = useState(
    location.pathname.includes("productos") ||
    location.pathname.includes("marcas") ||
    location.pathname.includes("categorias")
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: 240,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb"
        }
      }}
    >
      <List>

        {/* DASHBOARD */}
        <ListItemButton
          selected={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* DASHBOARD */}
        <ListItemButton
          selected={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>


        {/* CONFIGURACIONES */}
        <ListItemButton
          onClick={() => setOpenConfig(!openConfig)}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Configuraciones" />
          {openConfig ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        {/* CONFIGURACIONES */}
        <ListItemButton
          onClick={() => setOpenConfig(!openConfig)}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Facturacion" />
          {openConfig ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={openConfig} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/facturacion")}
              onClick={() => navigate("/facturacion")}
            >
              <ListItemIcon>
                <InventoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Facturación" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/marcas")}
              onClick={() => navigate("/marcas")}
            >
              <ListItemIcon>
                <CategoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Apertura Caja" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/categorias")}
              onClick={() => navigate("/categorias")}
            >
              <ListItemIcon>
                <CategoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Cierre de Caja" />
            </ListItemButton>

          </List>
        </Collapse>

        {/* CONFIGURACIONES */}
        <ListItemButton
          onClick={() => setOpenConfig(!openConfig)}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Reportes" />
          {openConfig ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={openConfig} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/facturacion")}
              onClick={() => navigate("/facturacion")}
            >
              <ListItemIcon>
                <InventoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Ventas" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/marcas")}
              onClick={() => navigate("/marcas")}
            >
              <ListItemIcon>
                <CategoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Stock de Productos" />
            </ListItemButton>

            <ListItemButton
              sx={{ pl: 4 }}
              selected={isActive("/categorias")}
              onClick={() => navigate("/categorias")}
            >
              <ListItemIcon>
                <CategoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Apertura Caja" />
            </ListItemButton>

          </List>
        </Collapse>

      </List>
    </Drawer>
  );
}