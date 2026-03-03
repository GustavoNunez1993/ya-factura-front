import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Sidebar from "../components/Sidebar";
import Topbar from "./Topbar";
import BreadcrumbsNav from "../components/BreadcrumbsNav";

const drawerWidth = 260;
const miniWidth = 80;

interface Props {
  toggleTheme: () => void;
}

export default function AdminLayout({ toggleTheme }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerSpace = collapsed ? miniWidth : drawerWidth;

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>

      <Topbar
        toggleSidebar={() =>
          isMobile
            ? setMobileOpen(true)
            : setCollapsed(!collapsed)
        }
        toggleTheme={toggleTheme}
      />

      {!isMobile && (
        <Box
          sx={{
            width: drawerSpace,
            flexShrink: 0,
            transition: "width .2s ease"
          }}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8,
          backgroundColor:
            theme.palette.mode === "dark"
              ? "#0b1120"
              : "#f4f6f9",
          p: 3,
          overflow: "auto"
        }}
      >
        <Box sx={{ maxWidth: 1400, margin: "0 auto" }}>
          <BreadcrumbsNav />

          <Box
            sx={{
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "#111827"
                  : "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              p: 3,
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}