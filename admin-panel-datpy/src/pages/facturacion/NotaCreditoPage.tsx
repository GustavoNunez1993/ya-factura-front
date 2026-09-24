import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { SelectButton } from "primereact/selectbutton";

import type { NotaCreditoItemPayload } from "../../services/FacturaService";
import { FacturaService, MOTIVOS_NOTA_CREDITO } from "../../services/FacturaService";
import { NRO_CAJA, verificarCajaAbierta } from "../../utils/caja";
import type { DetalleFacturaAprobada, FacturaAprobada } from "./SelectorFacturaAprobada";
import SelectorFacturaAprobada from "./SelectorFacturaAprobada";

type Modo = "cantidad" | "monto";

interface FilaNc {
  detalle: DetalleFacturaAprobada;
  incluir: boolean;
  modo: Modo;
  cantidad: number | null;
  monto: number | null;
}

const motivos = Object.entries(MOTIVOS_NOTA_CREDITO).map(([value, label]) => ({
  label: `${value} - ${label}`,
  value: Number(value)
}));

const alcances = [
  { label: "Total", value: "total" },
  { label: "Parcial", value: "parcial" }
];

const modos = [
  { label: "Cantidad", value: "cantidad" },
  { label: "Importe", value: "monto" }
];

const formasReintegro = [
  { label: "Efectivo", value: "EFECTIVO" },
  { label: "Transferencia", value: "TRANSFERENCIA" }
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value || 0);

/**
 * Alta de una Nota de Crédito Electrónica (iTiDE=5) sobre una factura aprobada por SIFEN:
 * total (todo lo pendiente de acreditar) o parcial, eligiendo por ítem una cantidad devuelta
 * o un importe (descuento, bonificación, ajuste de precio). Los topes los valida el back.
 * Con ?facturaId= la factura llega preseleccionada (desde el listado de facturas).
 */
export default function NotaCreditoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [factura, setFactura] = useState<FacturaAprobada | null>(null);
  const [motivo, setMotivo] = useState<number>(2);
  const [alcance, setAlcance] = useState<"total" | "parcial">("total");
  const [infAdic, setInfAdic] = useState("");
  const [reponerStock, setReponerStock] = useState(true);
  const [reintegrar, setReintegrar] = useState(true);
  const [formaReintegro, setFormaReintegro] = useState("EFECTIVO");
  const [filas, setFilas] = useState<FilaNc[]>([]);
  const [emitiendo, setEmitiendo] = useState(false);

  // Sin apertura de caja no se emite: se vuelve al listado o se va a abrir la caja.
  useEffect(() => {
    verificarCajaAbierta("Volver al listado").then((ok) => {
      if (!ok) navigate("/notas-credito");
    });
  }, [navigate]);

  // Al cambiar de factura se rearman los ítems y los valores por defecto.
  useEffect(() => {
    setFilas(
      (factura?.detalles ?? []).map((detalle) => ({
        detalle,
        incluir: false,
        modo: "cantidad",
        cantidad: detalle.cantidad,
        monto: null
      }))
    );
    setReintegrar(!!factura?.esContado);
  }, [factura]);

  // Por defecto sólo se repone stock en los motivos de devolución (1 y 2), igual que el back.
  useEffect(() => {
    setReponerStock(motivo === 1 || motivo === 2);
  }, [motivo]);

  const actualizarFila = (index: number, cambios: Partial<FilaNc>) => {
    setFilas((prev) => prev.map((f, i) => (i === index ? { ...f, ...cambios } : f)));
  };

  const totalEstimado = useMemo(() => {
    if (alcance === "total") return filas.reduce((t, f) => t + f.detalle.total, 0);
    return filas
      .filter((f) => f.incluir)
      .reduce((t, f) => {
        if (f.modo === "monto") return t + (f.monto ?? 0);
        const unitarioNeto = f.detalle.cantidad > 0 ? f.detalle.total / f.detalle.cantidad : 0;
        return t + unitarioNeto * (f.cantidad ?? 0);
      }, 0);
  }, [alcance, filas]);

  const emitir = async () => {
    if (!factura) {
      Swal.fire("Atención", "Elegí la factura a la que corresponde la nota de crédito.", "info");
      return;
    }

    let items: NotaCreditoItemPayload[] | undefined;
    if (alcance === "parcial") {
      const seleccionadas = filas.filter((f) => f.incluir);
      if (seleccionadas.length === 0) {
        Swal.fire("Atención", "Seleccioná al menos un ítem a acreditar.", "info");
        return;
      }
      const invalida = seleccionadas.find((f) =>
        f.modo === "cantidad" ? !f.cantidad || f.cantidad <= 0 : !f.monto || f.monto <= 0
      );
      if (invalida) {
        Swal.fire("Atención", `Indicá una cantidad o importe mayor a 0 para "${invalida.detalle.descripcion}".`, "info");
        return;
      }
      items = seleccionadas.map((f) =>
        f.modo === "cantidad"
          ? { detalleId: f.detalle.id, cantidad: f.cantidad! }
          : { detalleId: f.detalle.id, monto: f.monto! }
      );
    }

    try {
      setEmitiendo(true);
      const res = await FacturaService.crearNotaCredito(factura.id, {
        motivoEmision: motivo,
        dInfAdic: infAdic.trim() || undefined,
        items,
        reponerStock,
        nroCaja: NRO_CAJA,
        reintegrarEnCaja: reintegrar,
        formaReintegro: reintegrar ? formaReintegro : undefined
      });
      await Swal.fire({
        icon: "success",
        title: "Nota de crédito creada",
        html:
          `<div style="text-align:left"><b>Numeración:</b> ${res.dEst}-${res.dPunExp}-${res.dNumDoc}<br/>` +
          `<b>Total:</b> ${formatMoney(Number(res.total ?? 0))}<br/>` +
          `<b>Estado SIFEN:</b> ${res.estadoSifen ?? "Sin enviar"}</div>`
      });
      navigate("/notas-credito");
    } catch (error: unknown) {
      console.error(error);
      const mensaje =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No se pudo emitir la nota de crédito";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <div>
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Nueva nota de crédito</h2>
          <small className="text-color-secondary">Devolución, descuento o ajuste sobre una factura aprobada</small>
        </div>
        <Button label="Volver" icon="pi pi-arrow-left" severity="secondary" outlined onClick={() => navigate("/notas-credito")} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <label>Factura</label>
          <SelectorFacturaAprobada value={factura} onChange={setFactura} facturaIdInicial={searchParams.get("facturaId")} />
        </div>
        <div className="col-12 md:col-4">
          <label>Motivo de emisión</label>
          <Dropdown className="w-full" value={motivo} options={motivos} onChange={(e) => setMotivo(e.value)} />
        </div>
        <div className="col-12 md:col-2">
          <label>Alcance</label>
          <div>
            <SelectButton value={alcance} options={alcances} onChange={(e) => e.value && setAlcance(e.value)} />
          </div>
        </div>

        {factura && (
          <div className="col-12">
            {alcance === "total" ? (
              <small className="text-color-secondary">
                Acredita todo lo que quede pendiente de cada ítem de la factura {factura.numero} (descontando notas de
                crédito anteriores).
              </small>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: 6 }}></th>
                      <th style={{ padding: 6 }}>Ítem</th>
                      <th style={{ padding: 6, textAlign: "right" }}>Facturado</th>
                      <th style={{ padding: 6 }}>Acreditar por</th>
                      <th style={{ padding: 6 }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={f.detalle.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: 6 }}>
                          <Checkbox checked={f.incluir} onChange={(e) => actualizarFila(i, { incluir: !!e.checked })} />
                        </td>
                        <td style={{ padding: 6 }}>
                          <div>{f.detalle.descripcion}</div>
                          <small className="text-color-secondary">{f.detalle.codigo}</small>
                        </td>
                        <td style={{ padding: 6, textAlign: "right", whiteSpace: "nowrap" }}>
                          {f.detalle.cantidad} × {formatMoney(f.detalle.precioUnitario)}
                          <div><small className="text-color-secondary">{formatMoney(f.detalle.total)}</small></div>
                        </td>
                        <td style={{ padding: 6 }}>
                          <SelectButton
                            value={f.modo}
                            options={modos}
                            disabled={!f.incluir}
                            onChange={(e) => e.value && actualizarFila(i, { modo: e.value })}
                          />
                        </td>
                        <td style={{ padding: 6, minWidth: 140 }}>
                          {f.modo === "cantidad" ? (
                            <InputNumber
                              value={f.cantidad}
                              min={0}
                              max={f.detalle.cantidad}
                              maxFractionDigits={4}
                              disabled={!f.incluir}
                              inputStyle={{ width: "100%" }}
                              onValueChange={(e) => actualizarFila(i, { cantidad: e.value ?? null })}
                            />
                          ) : (
                            <InputNumber
                              value={f.monto}
                              min={0}
                              max={f.detalle.total}
                              maxFractionDigits={0}
                              prefix="Gs. "
                              disabled={!f.incluir}
                              inputStyle={{ width: "100%" }}
                              onValueChange={(e) => actualizarFila(i, { monto: e.value ?? null })}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="col-12 flex align-items-center gap-2">
          <Checkbox inputId="nc-reponer" checked={reponerStock} onChange={(e) => setReponerStock(!!e.checked)} />
          <label htmlFor="nc-reponer">Devolver la mercadería al stock (sólo ítems por cantidad)</label>
        </div>

        <div className="col-12 md:col-7 flex align-items-center gap-2">
          <Checkbox inputId="nc-reintegro" checked={reintegrar} onChange={(e) => setReintegrar(!!e.checked)} />
          <label htmlFor="nc-reintegro">Devolver el dinero por caja (egreso en la caja abierta)</label>
        </div>
        {reintegrar && (
          <div className="col-12 md:col-5">
            <Dropdown className="w-full" value={formaReintegro} options={formasReintegro} onChange={(e) => setFormaReintegro(e.value)} />
          </div>
        )}

        <div className="col-12">
          <label>Información adicional (opcional)</label>
          <InputTextarea
            className="w-full"
            rows={2}
            value={infAdic}
            placeholder="Referencia interna, observaciones..."
            onChange={(e) => setInfAdic(e.target.value)}
          />
        </div>

        <div className="col-12">
          <small className="text-color-secondary">
            Requiere un timbrado activo para <b>Nota de crédito</b>. Si la factura es a crédito, el total se descuenta de su
            saldo pendiente; si fue contado, se sugiere devolver el dinero por caja.
          </small>
        </div>

        <div className="col-12 flex justify-content-between align-items-center" style={{ flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Total a acreditar (estimado): {formatMoney(factura ? totalEstimado : 0)}</span>
          <Button label="Emitir nota de crédito" icon="pi pi-check" severity="success" loading={emitiendo} disabled={!factura} onClick={emitir} />
        </div>
      </div>
    </div>
  );
}
