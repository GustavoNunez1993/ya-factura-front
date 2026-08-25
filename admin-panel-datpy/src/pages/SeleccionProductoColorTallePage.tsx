import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

import { ProductosService } from "../services/ProductosService";
import { ColorService } from "../services/ColorService";
import { TalleService } from "../services/TalleService";
import { VarianteProductoService } from "../services/VarianteProductoService";
import { useIsMobile } from "../hooks/useIsMobile";

interface SelectorOption {
  value: string;
  label: string;
  colorHex?: string;
}

interface VarianteProducto {
  id: string;
  producto?: { id: string; descripcion?: string } | null;
  color?: { id: string; descripcion?: string; valorHexadecimal?: string } | null;
  talle?: { id: string; descripcion?: string } | null;
}

export default function SeleccionProductoColorTallePage() {
  const isMobile = useIsMobile();

  const [variantes, setVariantes] = useState<VarianteProducto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const size = 10;
  const [search, setSearch] = useState("");
  const [cargandoTabla, setCargandoTabla] = useState(false);

  const [productos, setProductos] = useState<SelectorOption[]>([]);
  const [colores, setColores] = useState<SelectorOption[]>([]);
  const [talles, setTalles] = useState<SelectorOption[]>([]);

  const [productoSeleccionado, setProductoSeleccionado] = useState<string | null>(null);
  const [coloresSeleccionados, setColoresSeleccionados] = useState<string[]>([]);
  const [tallesSeleccionados, setTallesSeleccionados] = useState<string[]>([]);

  const [loadingOpciones, setLoadingOpciones] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [open, setOpen] = useState(false);

  const [combosExistentes, setCombosExistentes] = useState<Set<string>>(new Set());
  const [cargandoCombos, setCargandoCombos] = useState(false);

  const cargarVariantes = async () => {
    setCargandoTabla(true);

    try {
      const res = await VarianteProductoService.getPaginated(page, size, search);
      setVariantes(res?.content ?? []);
      setTotal(res?.totalElements ?? 0);
    } catch (error) {
      console.error("Error cargando variantes de producto", error);
      setVariantes([]);
      setTotal(0);
    } finally {
      setCargandoTabla(false);
    }
  };

  const cargarOpciones = async () => {
    setLoadingOpciones(true);

    try {
      const [productosRes, coloresRes, tallesRes] = await Promise.all([
        ProductosService.getPaginated(0, 1000, ""),
        ColorService.getPaginated(0, 1000, ""),
        TalleService.getPaginated(0, 1000, "")
      ]);

      const productosData = Array.isArray(productosRes) ? productosRes : productosRes?.content ?? [];
      const coloresData = Array.isArray(coloresRes) ? coloresRes : coloresRes?.content ?? [];
      const tallesData = Array.isArray(tallesRes) ? tallesRes : tallesRes?.content ?? [];

      setProductos(
        productosData.map((item: any) => ({
          value: item.id,
          label: item.nombre ?? item.descripcion ?? item.codigo ?? "Producto"
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
      setLoadingOpciones(false);
    }
  };

  useEffect(() => {
    cargarVariantes();
  }, [page, search]);

  useEffect(() => {
    cargarOpciones();
  }, []);

  useEffect(() => {
    if (!productoSeleccionado) {
      setCombosExistentes(new Set());
      return;
    }

    let cancelado = false;
    setCargandoCombos(true);

    VarianteProductoService.getAll()
      .then((data: any[]) => {
        if (cancelado) return;

        const combos = new Set(
          (data ?? [])
            .filter((item) => item?.producto?.id === productoSeleccionado)
            .map((item) => `${item.color?.id}_${item.talle?.id}`)
        );

        setCombosExistentes(combos);
      })
      .catch((error) => {
        console.error("Error verificando combinaciones existentes", error);
        if (!cancelado) setCombosExistentes(new Set());
      })
      .finally(() => {
        if (!cancelado) setCargandoCombos(false);
      });

    return () => {
      cancelado = true;
    };
  }, [productoSeleccionado]);

  const coloresSeleccionadosData = useMemo(
    () => colores.filter((item) => coloresSeleccionados.includes(item.value)),
    [colores, coloresSeleccionados]
  );

  const tallesSeleccionadosData = useMemo(
    () => talles.filter((item) => tallesSeleccionados.includes(item.value)),
    [talles, tallesSeleccionados]
  );

  const combinaciones = useMemo(() => {
    if (!coloresSeleccionadosData.length || !tallesSeleccionadosData.length) {
      return [];
    }

    const result: { colorId: string; colorLabel: string; colorHex?: string; talleId: string; talleLabel: string; yaExiste: boolean }[] = [];

    coloresSeleccionadosData.forEach((color) => {
      tallesSeleccionadosData.forEach((talle) => {
        result.push({
          colorId: color.value,
          colorLabel: color.label,
          colorHex: color.colorHex,
          talleId: talle.value,
          talleLabel: talle.label,
          yaExiste: combosExistentes.has(`${color.value}_${talle.value}`)
        });
      });
    });

    return result;
  }, [coloresSeleccionadosData, tallesSeleccionadosData, combosExistentes]);

  const combinacionesNuevas = useMemo(() => combinaciones.filter((c) => !c.yaExiste), [combinaciones]);
  const combinacionesDuplicadas = combinaciones.length - combinacionesNuevas.length;

  const puedeConfirmar =
    Boolean(productoSeleccionado) && combinacionesNuevas.length > 0 && !guardando && !cargandoCombos;

  const abrirNuevo = () => {
    setProductoSeleccionado(null);
    setColoresSeleccionados([]);
    setTallesSeleccionados([]);
    setCombosExistentes(new Set());
    setOpen(true);
  };

  const cerrarDialog = () => {
    setOpen(false);
    setProductoSeleccionado(null);
    setColoresSeleccionados([]);
    setTallesSeleccionados([]);
    setCombosExistentes(new Set());
  };

  const confirmarSeleccion = async () => {
    if (!productoSeleccionado || combinacionesNuevas.length === 0) {
      return;
    }

    setGuardando(true);

    try {
      const resultados = await Promise.allSettled(
        combinacionesNuevas.map((combo) =>
          VarianteProductoService.create({
            productoId: productoSeleccionado,
            colorId: combo.colorId,
            talleId: combo.talleId
          })
        )
      );

      const exitosas = resultados.filter((r) => r.status === "fulfilled").length;
      const duplicadas = resultados.filter(
        (r) => r.status === "rejected" && (r as PromiseRejectedResult).reason?.response?.status === 409
      ).length;
      const fallidas = resultados.length - exitosas - duplicadas;

      const omitidasDeAntemano = combinacionesDuplicadas;
      const totalOmitidas = duplicadas + omitidasDeAntemano;

      if (fallidas === 0) {
        const detalle = totalOmitidas > 0 ? ` (${totalOmitidas} ya existían y fueron omitidas)` : "";
        Swal.fire("Guardado", `Se crearon ${exitosas} combinación(es) de producto, color y talle${detalle}.`, "success");
        cerrarDialog();
        cargarVariantes();
      } else {
        Swal.fire("Completado con errores", `Creadas: ${exitosas}. Ya existentes: ${totalOmitidas}. Fallidas: ${fallidas}.`, "warning");
        cargarVariantes();
      }
    } catch (error: any) {
      console.error("Error guardando las combinaciones", error);
      const mensaje = error?.response?.data?.message || "No se pudieron guardar las combinaciones";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar la variante?",
      text: "Esta combinación de producto, color y talle será eliminada",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!result.isConfirmed) return;

    try {
      await VarianteProductoService.remove(id);
      Swal.fire("Eliminada", "La variante fue eliminada correctamente", "success");
      cargarVariantes();
    } catch (error) {
      console.error("Error eliminando la variante", error);
      Swal.fire("Error", "No se pudo eliminar la variante", "error");
    }
  };

  const colorOptionTemplate = (option: SelectorOption) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 5,
          background: option.colorHex ?? "#cbd5e1",
          border: "1px solid rgba(15, 23, 42, 0.15)",
          flexShrink: 0
        }}
      />
      <span>{option.label}</span>
    </div>
  );

  const colorBodyTemplate = (rowData: VarianteProducto) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          background: rowData.color?.valorHexadecimal ?? "#cbd5e1",
          border: "1px solid rgba(15, 23, 42, 0.15)",
          flexShrink: 0
        }}
      />
      <span>{rowData.color?.descripcion ?? "-"}</span>
    </div>
  );

  const accionesTemplate = (rowData: VarianteProducto) => (
    <div className="flex gap-2 justify-content-center">
      <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" onClick={() => eliminar(rowData.id)} />
    </div>
  );

  return (
    <div className="card">
      <div className="flex justify-content-between align-items-center mb-3" style={{ flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 className="m-0">Variantes de producto</h2>
          <small className="text-color-secondary">Combinaciones de producto, color y talle</small>
        </div>
        <Button label="Nueva variante" icon="pi pi-plus" severity="success" onClick={abrirNuevo} />
      </div>

      <div className="p-input-icon-left mb-3 w-full">
        <i className="pi pi-search" />
        <InputText
          className="w-full"
          placeholder="Buscar por producto, color o talle..."
          value={search}
          onChange={(e) => { setPage(0); setSearch(e.target.value); }}
        />
      </div>

      {isMobile ? (
        <>
          {variantes.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>
              {cargandoTabla ? "Cargando..." : "No existen variantes registradas"}
            </p>
          ) : variantes.map((item) => (
            <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px", marginBottom: 8, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.producto?.descripcion ?? "-"}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: item.color?.valorHexadecimal ?? "#cbd5e1",
                        border: "1px solid rgba(15, 23, 42, 0.15)"
                      }}
                    />
                    {item.color?.descripcion ?? "-"} · Talle {item.talle?.descripcion ?? "-"}
                  </div>
                </div>
                {accionesTemplate(item)}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, alignItems: "center" }}>
            <Button icon="pi pi-angle-left" text size="small" disabled={page === 0} onClick={() => setPage(page - 1)} />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Pág. {page + 1} de {Math.max(1, Math.ceil(total / size))}</span>
            <Button icon="pi pi-angle-right" text size="small" disabled={(page + 1) * size >= total} onClick={() => setPage(page + 1)} />
          </div>
        </>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <DataTable
            value={variantes}
            paginator
            rows={size}
            totalRecords={total}
            lazy
            loading={cargandoTabla}
            size="small"
            first={page * size}
            onPage={(e) => setPage(e.page ?? 0)}
            stripedRows
            showGridlines
            emptyMessage="No existen variantes registradas"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
          >
            <Column field="producto.descripcion" header="Producto" sortable />
            <Column header="Color" body={colorBodyTemplate} style={{ width: "220px" }} />
            <Column field="talle.descripcion" header="Talle" style={{ width: "160px" }} />
            <Column header="Acciones" body={accionesTemplate} style={{ width: "120px" }} />
          </DataTable>
        </div>
      )}

      <Dialog
        header="Nueva variante de producto"
        visible={open}
        modal
        draggable={false}
        resizable={false}
        style={{ width: "900px" }}
        onHide={cerrarDialog}
      >
        <p style={{ margin: "0 0 20px", color: "#64748b" }}>
          Elige un producto y todas las combinaciones de color y talle que quieras generar. Se crearán todas las combinaciones
          posibles entre los colores y talles seleccionados.
        </p>

        <div className="grid gap-4">
          <div className="col-12">
            <label style={{ fontWeight: 600, color: "#334155" }}>Producto</label>
            <Dropdown
              value={productoSeleccionado}
              options={productos}
              optionLabel="label"
              optionValue="value"
              placeholder={loadingOpciones ? "Cargando productos..." : "Seleccione producto"}
              className="w-full mt-2"
              onChange={(e) => setProductoSeleccionado(e.value)}
              disabled={loadingOpciones}
              showClear
              filter
            />
          </div>

          <div className="col-12 md:col-6">
            <label style={{ fontWeight: 600, color: "#334155" }}>Colores (múltiple)</label>
            <MultiSelect
              value={coloresSeleccionados}
              options={colores}
              optionLabel="label"
              optionValue="value"
              itemTemplate={colorOptionTemplate}
              placeholder={loadingOpciones ? "Cargando colores..." : "Seleccione uno o más colores"}
              className="w-full mt-2"
              display="chip"
              onChange={(e) => setColoresSeleccionados(e.value)}
              disabled={loadingOpciones}
              filter
              showClear
            />
          </div>

          <div className="col-12 md:col-6">
            <label style={{ fontWeight: 600, color: "#334155" }}>Talles (múltiple)</label>
            <MultiSelect
              value={tallesSeleccionados}
              options={talles}
              optionLabel="label"
              optionValue="value"
              placeholder={loadingOpciones ? "Cargando talles..." : "Seleccione uno o más talles"}
              className="w-full mt-2"
              display="chip"
              onChange={(e) => setTallesSeleccionados(e.value)}
              disabled={loadingOpciones}
              filter
              showClear
            />
          </div>
        </div>

        {combinaciones.length > 0 && (
          <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Combinaciones</span>
              <div style={{ display: "flex", gap: 8 }}>
                <Tag value={`${combinacionesNuevas.length} nuevas`} severity="success" />
                {combinacionesDuplicadas > 0 && <Tag value={`${combinacionesDuplicadas} ya existen`} severity="warning" />}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 160, overflowY: "auto" }}>
              {combinaciones.map((combo) => (
                <div
                  key={`${combo.colorId}-${combo.talleId}`}
                  title={combo.yaExiste ? "Esta combinación ya existe para el producto seleccionado" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: combo.yaExiste ? "#fef3c7" : "#ffffff",
                    border: combo.yaExiste ? "1px solid #fbbf24" : "1px solid #cbd5e1",
                    opacity: combo.yaExiste ? 0.85 : 1
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: combo.colorHex ?? "#cbd5e1",
                      border: "1px solid rgba(15, 23, 42, 0.15)"
                    }}
                  />
                  <span style={{ fontSize: 13, color: "#334155" }}>{combo.colorLabel} · {combo.talleLabel}</span>
                  {combo.yaExiste && <i className="pi pi-exclamation-triangle" style={{ fontSize: 12, color: "#b45309" }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-content-end gap-2 mt-4">
          <Button label="Cancelar" severity="secondary" onClick={cerrarDialog} />
          <Button
            label={combinacionesNuevas.length > 0 ? `Crear ${combinacionesNuevas.length} combinación${combinacionesNuevas.length === 1 ? "" : "es"}` : "Confirmar selección"}
            icon="pi pi-check"
            severity="success"
            loading={guardando || cargandoCombos}
            disabled={!puedeConfirmar}
            onClick={confirmarSeleccion}
          />
        </div>
      </Dialog>
    </div>
  );
}
