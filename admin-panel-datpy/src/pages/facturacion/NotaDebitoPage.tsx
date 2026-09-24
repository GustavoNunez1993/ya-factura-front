import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { AutoComplete } from "primereact/autocomplete";
import type { AutoCompleteCompleteEvent } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";

import { FacturaService, MOTIVOS_NOTA_CREDITO } from "../../services/FacturaService";
import { ProductosService } from "../../services/ProductosService";
import { NRO_CAJA, verificarCajaAbierta } from "../../utils/caja";
import type { FacturaAprobada } from "./SelectorFacturaAprobada";
import SelectorFacturaAprobada from "./SelectorFacturaAprobada";

interface ProductoOpcion {
  id: string;
  codigo?: string;
  descripcion: string;
  precioVenta?: number;
}

interface Cargo {
  producto: ProductoOpcion | null;
  cantidad: number | null;
  precioUnitario: number | null;
  dInfItem: string;
}

// La ND usa la misma tabla de motivos (iMotEmi) que la NC.
const motivos = Object.entries(MOTIVOS_NOTA_CREDITO).map(([value, label]) => ({
  label: `${value} - ${label}`,
  value: Number(value)
}));

const cargoVacio = (): Cargo => ({ producto: null, cantidad: 1, precioUnitario: null, dInfItem: "" });

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value || 0);

/**
 * Alta de una Nota de Débito Electrónica (iTiDE=6) sobre una factura aprobada por SIFEN:
 * cargos nuevos (intereses, ajuste de precio, gastos). El IVA de cada cargo sale del producto.
 * Con ?facturaId= la factura llega preseleccionada (desde el listado de facturas).
 */
export default function NotaDebitoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [factura, setFactura] = useState<FacturaAprobada | null>(null);
  const [motivo, setMotivo] = useState<number>(8);
  const [infAdic, setInfAdic] = useState("");
  const [cargos, setCargos] = useState<Cargo[]>([cargoVacio()]);
  const [sugerencias, setSugerencias] = useState<ProductoOpcion[]>([]);
  const [emitiendo, setEmitiendo] = useState(false);

  // Sin apertura de caja no se emite: se vuelve al listado o se va a abrir la caja.
  useEffect(() => {
    verificarCajaAbierta("Volver al listado").then((ok) => {
      if (!ok) navigate("/notas-debito");
    });
  }, [navigate]);

  const buscarProductos = async (e: AutoCompleteCompleteEvent) => {
    try {
      const res = await ProductosService.getPaginated(0, 20, e.query);
      setSugerencias(res?.content ?? []);
    } catch {
      setSugerencias([]);
    }
  };

  const actualizarCargo = (index: number, cambios: Partial<Cargo>) => {
    setCargos((prev) => prev.map((c, i) => (i === index ? { ...c, ...cambios } : c)));
  };

  const total = useMemo(
    () => cargos.reduce((t, c) => t + (c.cantidad ?? 0) * (c.precioUnitario ?? 0), 0),
    [cargos]
  );

  const emitir = async () => {
    if (!factura) {
      Swal.fire("Atención", "Elegí la factura a la que corresponde la nota de débito.", "info");
      return;
    }
    const invalido = cargos.findIndex(
      (c) => !c.producto || !c.cantidad || c.cantidad <= 0 || !c.precioUnitario || c.precioUnitario <= 0
    );
    if (invalido >= 0) {
      Swal.fire("Atención", `Completá producto, cantidad y precio del cargo ${invalido + 1}.`, "info");
      return;
    }

    try {
      setEmitiendo(true);
      const res = await FacturaService.crearNotaDebito(factura.id, {
        motivoEmision: motivo,
        dInfAdic: infAdic.trim() || undefined,
        nroCaja: NRO_CAJA,
        items: cargos.map((c) => ({
          productoId: c.producto!.id,
          cantidad: c.cantidad!,
          precioUnitario: c.precioUnitario!,
          dInfItem: c.dInfItem.trim() || undefined
        }))
      });
      await Swal.fire({
        icon: "success",
        title: "Nota de débito creada",
        html:
          `<div style="text-align:left"><b>Numeración:</b> ${res.dEst}-${res.dPunExp}-${res.dNumDoc}<br/>` +
          `<b>Total:</b> ${formatMoney(Number(res.total ?? 0))}<br/>` +
          `<b>Estado SIFEN:</b> ${res.estadoSifen ?? "Sin enviar"}</div>`
      });
      navigate("/notas-debito");
    } catch (error: unknown) {
      console.error(error);
      const mensaje =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No se pudo emitir la nota de débito";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Nueva nota de débito</h2>
          <small className="text-color-secondary">Intereses, ajustes de precio o gastos sobre una factura aprobada</small>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined onClick={() => navigate("/notas-debito")} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-7">
          <label>Factura</label>
          <SelectorFacturaAprobada value={factura} onChange={setFactura} facturaIdInicial={searchParams.get("facturaId")} />
        </div>
        <div className="col-12 md:col-5">
          <label>Motivo de emisión</label>
          <Dropdown className="w-full" value={motivo} options={motivos} onChange={(e) => setMotivo(e.value)} />
        </div>

        <div className="col-12"><h4 className="m-0 mt-2">Cargos</h4></div>
        <div className="col-12">
          {cargos.map((c, i) => (
            <div key={i} className="grid align-items-end" style={{ borderBottom: "1px solid #f3f4f6", margin: 0 }}>
              <div className="col-12 md:col-5">
                <small>Producto / servicio</small>
                <AutoComplete
                  className="w-full"
                  inputClassName="w-full"
                  value={c.producto}
                  suggestions={sugerencias}
                  completeMethod={buscarProductos}
                  field="descripcion"
                  placeholder="Buscar (ej: Intereses)"
                  forceSelection
                  onChange={(e) => {
                    const producto = typeof e.value === "object" ? (e.value as ProductoOpcion) : null;
                    actualizarCargo(i, {
                      producto,
                      precioUnitario:
                        producto?.precioVenta != null && Number(producto.precioVenta) > 0
                          ? Number(producto.precioVenta)
                          : c.precioUnitario
                    });
                  }}
                />
              </div>
              <div className="col-4 md:col-2">
                <small>Cantidad</small>
                <InputNumber
                  value={c.cantidad}
                  min={0}
                  maxFractionDigits={4}
                  inputStyle={{ width: "100%" }}
                  onValueChange={(e) => actualizarCargo(i, { cantidad: e.value ?? null })}
                />
              </div>
              <div className="col-8 md:col-3">
                <small>Precio unitario (IVA incl.)</small>
                <InputNumber
                  value={c.precioUnitario}
                  min={0}
                  maxFractionDigits={0}
                  prefix="Gs. "
                  inputStyle={{ width: "100%" }}
                  onValueChange={(e) => actualizarCargo(i, { precioUnitario: e.value ?? null })}
                />
              </div>
              <div className="col-12 md:col-2 flex justify-content-end">
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  disabled={cargos.length === 1}
                  onClick={() => setCargos((prev) => prev.filter((_, j) => j !== i))}
                />
              </div>
              <div className="col-12">
                <InputText
                  className="w-full"
                  value={c.dInfItem}
                  placeholder="Detalle del cargo (opcional), ej: intereses por 15 días de atraso"
                  onChange={(e) => actualizarCargo(i, { dInfItem: e.target.value })}
                />
              </div>
            </div>
          ))}
          <Button className="mt-2" label="Agregar cargo" icon="pi pi-plus" text onClick={() => setCargos((prev) => [...prev, cargoVacio()])} />
        </div>

        <div className="col-12">
          <label>Información adicional (opcional)</label>
          <InputTextarea className="w-full" rows={2} value={infAdic} onChange={(e) => setInfAdic(e.target.value)} />
        </div>

        <div className="col-12">
          <small className="text-color-secondary">
            Requiere un timbrado activo para <b>Nota de débito</b>. El IVA de cada cargo se toma del producto. Si la factura
            es a crédito, el total se suma a su saldo pendiente.
          </small>
        </div>

        <div className="col-12 flex justify-content-between align-items-center" style={{ flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Total a debitar: {formatMoney(total)}</span>
          <Button label="Emitir nota de débito" icon="pi pi-check" severity="success" loading={emitiendo} disabled={!factura} onClick={emitir} />
        </div>
      </div>
    </div>
  );
}
