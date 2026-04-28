import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "./Topbar";

interface Props {
  toggleTheme: () => void;
}

export default function AdminLayout({ toggleTheme }: Props) {

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, []);

  return (

    <div className="flex flex-column h-screen">

      <Topbar
        toggleSidebar={() =>
          isMobile
            ? setMobileOpen(true)
            : setCollapsed(!collapsed)
        }
        toggleTheme={toggleTheme}
      />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main
          className="flex-1 overflow-auto"
          style={{
            background: "#f4f6f9",
            padding: "16px"
          }}
        >

          <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "10px",
                padding: "20px",
                border: "1px solid #e5e7eb",
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