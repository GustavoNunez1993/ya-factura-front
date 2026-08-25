import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { Badge } from "primereact/badge";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { resolveAssetUrl } from "../services/api";
import { StockService, type StockItem } from "../services/StockService";

interface Props {
  toggleSidebar: () => void;
}

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const diasParaVencer = (vencimiento: string | null) => {
  if (!vencimiento) return null;

  const hoy = startOfDay(new Date());
  const fechaVencimiento = startOfDay(new Date(vencimiento));

  return Math.round((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

export default function Topbar({ toggleSidebar }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const notificacionesRef = useRef<OverlayPanel>(null);

  const [productosPorVencer, setProductosPorVencer] = useState<StockItem[]>([]);

  const isDark = theme === "dark";
  const fotoUrl = resolveAssetUrl(user?.fotoUrl);
  const iniciales = (user?.nombre?.[0] ?? "").toUpperCase() || "U";

  useEffect(() => {
    let activo = true;

    StockService.getPorVencer(15)
      .then((res) => {
        if (activo) setProductosPorVencer(res ?? []);
      })
      .catch(() => {
        if (activo) setProductosPorVencer([]);
      });

    return () => {
      activo = false;
    };
  }, []);

  const irAStock = () => {
    notificacionesRef.current?.hide();
    navigate("/stock");
  };

  return (

    <div
      className="flex align-items-center justify-content-between"
      style={{
        height: 60,
        background: isDark ? "#0f172a" : "#ffffff",
        color: isDark ? "#e2e8f0" : "#111827",
        borderBottom: `1px solid ${isDark ? "#1e293b" : "#e5e7eb"}`,
        padding: "0 20px"
      }}
    >

      <div className="flex align-items-center gap-3">

        <Button
          icon="pi pi-bars"
          text
          onClick={toggleSidebar}
        />

        <span style={{ fontWeight: 600 }}>
          Sistema Administrativo - Ya Factura
          {user?.empresaNombre && (
            <span style={{ fontWeight: 400, opacity: 0.75 }}> · {user.empresaNombre}</span>
          )}
        </span>

      </div>

      <div className="flex align-items-center gap-3">

        <Button
          icon={isDark ? "pi pi-sun" : "pi pi-moon"}
          text
          tooltip={isDark ? "Modo claro" : "Modo oscuro"}
          tooltipOptions={{ position: "bottom" }}
          onClick={toggleTheme}
        />

        <span
          style={{ position: "relative", cursor: "pointer", display: "inline-flex" }}
          title="Notificaciones"
          onClick={(e) => notificacionesRef.current?.toggle(e)}
        >
          <i className="pi pi-bell" style={{ fontSize: "1.1rem" }} />
          {productosPorVencer.length > 0 && (
            <Badge
              value={productosPorVencer.length > 9 ? "9+" : productosPorVencer.length}
              severity="danger"
              style={{ position: "absolute", top: -8, right: -10, pointerEvents: "none" }}
            />
          )}
        </span>

        <OverlayPanel ref={notificacionesRef} style={{ width: "360px" }}>
          <div className="flex justify-content-between align-items-center mb-2">
            <span style={{ fontWeight: 700 }}>Notificaciones</span>
            {productosPorVencer.length > 0 && (
              <span className="text-600" style={{ fontSize: 13 }}>{productosPorVencer.length} por vencer</span>
            )}
          </div>

          {productosPorVencer.length === 0 ? (
            <div className="text-center text-600 py-3" style={{ fontSize: 13 }}>
              No hay productos por vencer en los próximos 15 días
            </div>
          ) : (
            <div className="flex flex-column gap-2" style={{ maxHeight: 320, overflowY: "auto" }}>
              {productosPorVencer.slice(0, 8).map((item) => {
                const dias = diasParaVencer(item.vencimiento);
                const vencido = dias !== null && dias < 0;

                return (
                  <div
                    key={item.id}
                    className="p-2 border-round-lg flex align-items-start gap-2"
                    style={{ background: isDark ? "#1e293b" : "#f8fafc", cursor: "pointer" }}
                    onClick={irAStock}
                  >
                    <i
                      className={`pi ${vencido ? "pi-times-circle text-red-500" : "pi-clock text-orange-500"}`}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{item.productoDescripcion}</div>
                      <div className="text-600" style={{ fontSize: 12 }}>
                        {item.depositoNombre}
                        {item.lote ? ` · Lote: ${item.lote}` : ""}
                        {" · "}
                        {vencido
                          ? `Vencido hace ${Math.abs(dias!)} día${Math.abs(dias!) === 1 ? "" : "s"}`
                          : `Vence en ${dias} día${dias === 1 ? "" : "s"}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            label="Ver Stock"
            icon="pi pi-arrow-right"
            iconPos="right"
            text
            className="w-full mt-2"
            onClick={irAStock}
          />
        </OverlayPanel>

        <div
          onClick={() => navigate("/perfil")}
          title="Mi perfil"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#6366f1",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt="Perfil"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            iniciales
          )}
        </div>

      </div>

    </div>

  );

}
