import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { ProductosService } from "../services/ProductosService";
import { ColorService } from "../services/ColorService";
import { TalleService } from "../services/TalleService";

interface SelectorOption {
  value: string;
  label: string;
  colorHex?: string;
}

export default function SeleccionProductoColorTallePage() {
  const [productos, setProductos] = useState<SelectorOption[]>([]);
  const [colores, setColores] = useState<SelectorOption[]>([]);
  const [talles, setTalles] = useState<SelectorOption[]>([]);

  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [colorSeleccionado, setColorSeleccionado] = useState<string | null>(null);
  const [talleSeleccionado, setTalleSeleccionado] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const cargarOpciones = async () => {
    setLoading(true);

    try {
      const [productosRes, coloresRes, tallesRes] = await Promise.all([
        ProductosService.getPaginated(0, 1000, ""),
        ColorService.getPaginated(0, 1000, ""),
        TalleService.getPaginated(0, 1000, "")
      ]);

      const productosData = Array.isArray(productosRes)
        ? productosRes
        : productosRes?.content ?? [];
      const coloresData = Array.isArray(coloresRes)
        ? coloresRes
        : coloresRes?.content ?? [];
      const tallesData = Array.isArray(tallesRes)
        ? tallesRes
        : tallesRes?.content ?? [];

      setProductos(
        productosData.map((item: any) => ({
          value: item.id,
          label: item.nombre ?? item.descripcion ?? item.codigo ?? "Producto",
          colorHex: undefined
        }))
      );

      setColores(
        coloresData.map((item: any) => ({
          value: item.id,
          label: item.nombre ?? item.descripcion ?? item.codigo ?? "Color",
          colorHex: item.colorHex ?? item.color ?? "#2563EB"
        }))
      );

      setTalles(
        tallesData.map((item: any) => ({
          value: item.id,
          label: item.descripcion ?? item.nombre ?? item.codigo ?? "Talle"
        }))
      );
    } catch (error) {
      console.error("Error cargando opciones de selección", error);
      setProductos([]);
      setColores([]);
      setTalles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOpciones();
  }, []);

  const productoSeleccionadoData = productos.find((item) => item.value === productoSeleccionado) ?? null;
  const colorSeleccionadoData = colores.find((item) => item.value === colorSeleccionado) ?? null;
  const talleSeleccionadoData = talles.find((item) => item.value === talleSeleccionado) ?? null;

  const confirmarSeleccion = () => {
    if (!productoSeleccionadoData || !colorSeleccionadoData || !talleSeleccionadoData) {
      return;
    }

    const detalle = `
Producto: ${productoSeleccionadoData.label}
Color: ${colorSeleccionadoData.label}
Talle: ${talleSeleccionadoData.label}
    `;

    alert(detalle);
  };

  return (
    <div style={{ width: "100%", padding: "24px 20px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            background: "#ffffff",
            padding: 28,
            borderRadius: 24,
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
            border: "1px solid #f1f5f9"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 24,
              flexWrap: "wrap",
              marginBottom: 28,
              padding: "24px 22px",
              borderRadius: 20,
              background: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ flex: 1, minWidth: 320 }}>
              <h2 style={{ margin: 0, fontSize: 28 }}>Seleccionar producto, color y talle</h2>
              <p style={{ margin: "14px 0 0", color: "#475569", lineHeight: 1.7 }}>
                Usa este panel para preparar una combinación rápida de producto, color y talle con un resumen claro y una vista de color instantánea.
              </p>
            </div>
            <div style={{ minWidth: 220, textAlign: "right" }}>
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                  padding: "14px 18px",
                  borderRadius: 16,
                  background: "#eef2ff",
                  color: "#3730a3",
                  fontWeight: 600
                }}
              >
                <span>Opciones visibles</span>
                <span>{productos.length} productos</span>
                <span>{colores.length} colores</span>
                <span>{talles.length} talles</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="col-12 lg:8">
              <div style={{ padding: 24, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="grid gap-4">
                  <div className="col-12 md:col-4">
                    <label>Producto</label>
                    <Dropdown
                      value={productoSeleccionado}
                      options={productos}
                      optionLabel="label"
                      optionValue="value"
                      placeholder={loading ? "Cargando productos..." : "Seleccione producto"}
                      className="w-full"
                      onChange={(e) => setProductoSeleccionado(e.value)}
                      disabled={loading}
                      showClear
                      filter
                    />
                    {!loading && productos.length === 0 && (
                      <small className="p-error">No se encontraron productos</small>
                    )}
                  </div>

                  <div className="col-12 md:col-4">
                    <label>Color</label>
                    <Dropdown
                      value={colorSeleccionado}
                      options={colores}
                      optionLabel="label"
                      optionValue="value"
                      placeholder={loading ? "Cargando colores..." : "Seleccione color"}
                      className="w-full"
                      onChange={(e) => setColorSeleccionado(e.value)}
                      disabled={loading}
                      showClear
                      filter
                    />
                  </div>

                  <div className="col-12 md:col-4">
                    <label>Talle</label>
                    <Dropdown
                      value={talleSeleccionado}
                      options={talles}
                      optionLabel="label"
                      optionValue="value"
                      placeholder={loading ? "Cargando talles..." : "Seleccione talle"}
                      className="w-full"
                      onChange={(e) => setTalleSeleccionado(e.value)}
                      disabled={loading}
                      showClear
                      filter
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 align-items-center mt-5">
                  <Button
                    label="Confirmar selección"
                    icon="pi pi-check"
                    disabled={!productoSeleccionado || !colorSeleccionado || !talleSeleccionado}
                    onClick={confirmarSeleccion}
                  />

                  {colorSeleccionadoData?.colorHex && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#ffffff",
                        padding: "12px 16px",
                        borderRadius: 12,
                        border: "1px solid #cbd5e1"
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#334155" }}>Vista de color:</span>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: colorSeleccionadoData.colorHex,
                          border: "1px solid #94a3b8"
                        }}
                      />
                      <span style={{ color: "#475569" }}>{colorSeleccionadoData.colorHex}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 lg:4">
              <div style={{ padding: 24, borderRadius: 20, background: "#ffffff", border: "1px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 20 }}>Resumen de selección</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Producto</div>
                    <div style={{ color: "#334155" }}>{productoSeleccionadoData?.label ?? "Sin selección"}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Color</div>
                    <div style={{ color: "#334155" }}>{colorSeleccionadoData?.label ?? "Sin selección"}</div>
                  </div>
                  <div style={{ padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>Talle</div>
                    <div style={{ color: "#334155" }}>{talleSeleccionadoData?.label ?? "Sin selección"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
