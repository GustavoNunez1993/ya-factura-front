import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Typography,
  Divider
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const drawerWidth = 260;
const miniWidth = 80;

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  setMobileOpen
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [openConfig, setOpenConfig] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={() => setMobileOpen(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: collapsed && !isMobile ? miniWidth : drawerWidth,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          transition: "width .2s ease"
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography fontWeight={700} fontSize={18}>
          Sistema
        </Typography>
      </Box>

      <List>

        <MenuItem
          icon={<DashboardIcon />}
          label="Dashboard"
          active={isActive("/dashboard")}
          collapsed={collapsed}
          onClick={() => handleNavigate("/dashboard")}
        />

        <ListItemButton
          onClick={() => setOpenConfig(!openConfig)}
          sx={{ px: 3 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>

          {!collapsed && (
            <>
              <ListItemText
                primary="Configuraciones"
                primaryTypographyProps={{ fontSize: 14 }}
              />
              {openConfig ? <ExpandLess /> : <ExpandMore />}
            </>
          )}
        </ListItemButton>

        <Collapse in={openConfig && !collapsed}>
          <SubItem
            icon={<InventoryIcon fontSize="small" />}
            label="Productos"
            active={isActive("/productos")}
            onClick={() => handleNavigate("/productos")}
          />

          <SubItem
            icon={<CategoryIcon fontSize="small" />}
            label="Marcas"
            active={isActive("/marcas")}
            onClick={() => handleNavigate("/marcas")}
          />
        </Collapse>

      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <List>
        <ListItemButton onClick={logout} sx={{ px: 3 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary="Cerrar sesión"
              primaryTypographyProps={{ fontSize: 14 }}
            />
          )}
        </ListItemButton>
      </List>
    </Drawer>
  );
}

function MenuItem({
  icon,
  label,
  active,
  collapsed,
  onClick
}: any) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        px: 3,
        position: "relative",
        backgroundColor: active
          ? "rgba(37,99,235,0.06)"
          : "transparent",
        "&::before": active
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: 6,
              bottom: 6,
              width: 3,
              borderRadius: 2,
              backgroundColor: "#2563eb"
            }
          : {}
      }}
    >
      <ListItemIcon sx={{ minWidth: 32 }}>
        {icon}
      </ListItemIcon>

      {!collapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: 14,
            fontWeight: active ? 600 : 500
          }}
        />
      )}
    </ListItemButton>
  );
}

function SubItem({
  icon,
  label,
  active,
  onClick
}: any) {
  return (
    <ListItemButton
      onClick={onClick}
      sx={{
        pl: 6,
        backgroundColor: active
          ? "rgba(37,99,235,0.04)"
          : "transparent"
      }}
    >
      <ListItemIcon sx={{ minWidth: 28 }}>
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{ fontSize: 13 }}
      />
    </ListItemButton>
  );
}