import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "./Topbar";
import { useTheme } from "../context/ThemeContext";

export default function AdminLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-column h-screen">
      <Topbar
        toggleSidebar={() =>
          isMobile ? setMobileOpen((prev) => !prev) : setCollapsed((prev) => !prev)
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <Sidebar
            collapsed={collapsed}
            mobileOpen={false}
            setMobileOpen={setMobileOpen}
          />
        )}

        {isMobile && (
          <Sidebar
            collapsed={false}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        )}

        <main
          className="flex-1 overflow-auto"
          style={{
            background: isDark ? "#0b1220" : "#f4f6f9",
            padding: isMobile ? "10px" : "16px"
          }}
        >
          <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
            <div
              style={{
                background: isDark ? "#111827" : "#ffffff",
                color: isDark ? "#e2e8f0" : undefined,
                borderRadius: "10px",
                padding: isMobile ? "12px" : "20px",
                border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
            >
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
