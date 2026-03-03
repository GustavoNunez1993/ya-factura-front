import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Badge
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { useAuth } from "../context/AuthContext";

interface Props {
  toggleSidebar: () => void;
  toggleTheme: () => void;
  mode: "light" | "dark";
}

export default function Topbar({
  toggleSidebar,
  toggleTheme,
  mode
}: Props) {
  const { user } = useAuth();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? "#1e293b"
            : "white",
        color: "inherit",
        borderBottom: (theme) =>
          theme.palette.mode === "dark"
            ? "1px solid #334155"
            : "1px solid #e2e8f0",
        zIndex: 1201
      }}
    >
      <Toolbar>

        {/* Botón Sidebar */}
        <IconButton
          onClick={toggleSidebar}
          color="inherit"
        >
          <MenuIcon />
        </IconButton>

        {/* Título */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, fontWeight: 600 }}
        >
          Sistema Administrativo
        </Typography>

        {/* Dark / Light Toggle */}
        <IconButton
          onClick={toggleTheme}
          color="inherit"
        >
          {mode === "dark"
            ? <LightModeIcon />
            : <DarkModeIcon />}
        </IconButton>

        {/* Notificaciones */}
        <IconButton color="inherit">
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Usuario */}
        <Box display="flex" alignItems="center" gap={2} ml={2}>
          <Typography fontSize={14}>
            {user?.email}
          </Typography>
          <Avatar
            sx={{
              bgcolor: "#2563eb",
              width: 34,
              height: 34,
              fontSize: 14
            }}
          >
            {user?.email?.[0]?.toUpperCase()}
          </Avatar>
        </Box>

      </Toolbar>
    </AppBar>
  );
}