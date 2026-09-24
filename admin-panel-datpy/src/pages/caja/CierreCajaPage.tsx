import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";

import { useAuth } from "../../context/AuthContext";
import type { CajaResumen, LineaMonto } from "../../services/CajaAperturaCierreService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";
import { nombreTipoDocumento } from "../../services/FacturaService";
import { NRO_CAJA } from "../../utils/caja";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatMoney = (value?: number | null) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value || 0);

const formatFecha = (value?: string | null) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-PY") : "-");

function TablaMontos({ titulo, lineas, total, vacio }: { titulo: string; lineas: LineaMonto[]; total: number; vacio: string }) {
  return (
    <div className="surface-card border-1 surface-border border-round p-3 h-full">
      <div className="font-semibold mb-2">{titulo}</div>
      {lineas.length === 0 ? (
        <small className="text-color-secondary">{vacio}</small>
      ) : (
        lineas.map((l) => (
          <div key={l.forma} className="flex justify-content-between py-1" style={{ borderBottom: "1px dashed #e5e7eb" }}>
            <span className="text-color-secondary" style={{ textTransform: "capitalize" }}>{l.forma.toLowerCase()}</span>
            <span className="font-medium">{formatMoney(l.monto)}</span>
          </div>
        ))
      )}
      <div className="flex justify-content-between pt-2 font-bold">
        <span>Total</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}

/**
 * Arqueo y cierre de la caja abierta: muestra lo cobrado (ventas contado, neto de vuelto, y
 * cobros de cuenta corriente), lo pagado (reintegros, autofacturas) por forma de pago y el
 * efectivo que debería haber. Al cerrar se registra el efectivo contado y la diferencia;
 * desde ahí ya no se pueden emitir comprobantes hasta la próxima apertura.
 */
export default function CierreCajaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resumen, setResumen] = useState<CajaResumen | null>(null);
  const [sinCaja, setSinCaja] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [montoContado, setMontoContado] = useState<number | null>(null);
  const [observacion, setObservacion] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const caja = await CajaAperturaCierreService.getCajaAbierta(NRO_CAJA);
      setResumen(await CajaAperturaCierreService.getResumen(caja.id));
      setSinCaja(false);
    } catch {
      setResumen(null);
      setSinCaja(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const diferencia = resumen && montoContado != null ? montoContado - resumen.efectivoEsperado : null;

  const cerrar = async () => {
    if (!resumen) return;
    if (montoContado == null || montoContado < 0) {
      Swal.fire("Atención", "Ingresá el efectivo contado en caja.", "info");
      return;
    }
    const detalleDiferencia =
      diferencia === 0 ? "La caja cuadra." : diferencia! < 0 ? `Faltante de ${formatMoney(-diferencia!)}.` : `Sobrante de ${formatMoney(diferencia!)}.`;
    const { isConfirmed } = await Swal.fire({
      icon: diferencia === 0 ? "question" : "warning",
      title: `¿Cerrar la caja ${resumen.nroCaja}?`,
      html: `${detalleDiferencia}<br/><small>Después del cierre no se pueden emitir comprobantes hasta abrir una nueva caja.</small>`,
      showCancelButton: true,
      confirmButtonText: "Cerrar caja",
      cancelButtonText: "Volver"
    });
    if (!isConfirmed) return;

    try {
      setCerrando(true);
      const usuarioId = (user as { id?: unknown } | null)?.id;
      const cerrada = await CajaAperturaCierreService.cerrar(
        resumen.aperturaId,
        montoContado,
        observacion.trim() || undefined,
        typeof usuarioId === "string" && UUID_RE.test(usuarioId) ? usuarioId : undefined
      );
      setResumen(cerrada);
      await Swal.fire("Caja cerrada", detalleDiferencia, "success");
    } catch (error: unknown) {
      const mensaje =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "No se pudo cerrar la caja";
      Swal.fire("Error", mensaje, "error");
    } finally {
      setCerrando(false);
    }
  };

  if (cargando) {
    return <div className="p-3">Cargando caja...</div>;
  }

  if (sinCaja || !resumen) {
    return (
      <div>
        <h2 className="m-0">Cierre de caja</h2>
        <div className="surface-card border-1 surface-border border-round p-4 mt-3 text-center">
          <p className="mt-0">No hay una caja abierta para cerrar.</p>
          <Button label="Ir a apertura de caja" icon="pi pi-play-circle" onClick={() => navigate("/apertura-caja")} />
        </div>
      </div>
    );
  }

  const cerrada = resumen.estado === "CERRADA";

  return (
    <div>
      <div className="flex justify-content-between align-items-start mb-4" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 className="m-0">Cierre de caja {resumen.nroCaja}</h2>
          <small className="text-color-secondary">
            Abierta el {formatFecha(resumen.fechaApertura)} · Monto de apertura {formatMoney(resumen.montoApertura)}
          </small>
        </div>
        <Tag value={resumen.estado} severity={cerrada ? "secondary" : "success"} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Ventas contado" lineas={resumen.ventasPorForma} total={resumen.totalVentas} vacio="Sin ventas contado" />
        </div>
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Cobros de cuenta corriente" lineas={resumen.cobrosCuentaCorriente} total={resumen.totalCobros} vacio="Sin cobros" />
        </div>
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Salidas (reintegros, autofacturas)" lineas={resumen.egresosPorForma} total={resumen.totalEgresos} vacio="Sin salidas" />
        </div>

        <div className="col-12 md:col-6">
          <div className="surface-card border-1 surface-border border-round p-3 h-full">
            <div className="font-semibold mb-2">Comprobantes emitidos en esta caja</div>
            {resumen.comprobantes.length === 0 ? (
              <small className="text-color-secondary">Todavía no se emitió ningún comprobante.</small>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={{ padding: 4 }}>Tipo</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Emitidos</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Anulados</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.comprobantes.map((c) => (
                      <tr key={c.tipo} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: 4 }}>{nombreTipoDocumento(c.tipo)}</td>
                        <td style={{ padding: 4, textAlign: "right" }}>{c.emitidos}</td>
                        <td style={{ padding: 4, textAlign: "right" }}>{c.anulados}</td>
                        <td style={{ padding: 4, textAlign: "right" }}>{c.tipo === 7 ? "-" : formatMoney(c.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 md:col-6">
          <div className="surface-card border-1 surface-border border-round p-3 h-full">
            <div className="font-semibold mb-2">Arqueo de efectivo</div>
            <div className="flex justify-content-between py-1">
              <span className="text-color-secondary">Efectivo esperado</span>
              <span className="text-xl font-bold">{formatMoney(resumen.efectivoEsperado)}</span>
            </div>
            <small className="text-color-secondary">
              Apertura + ventas y cobros en efectivo − salidas en efectivo.
            </small>

            {cerrada ? (
              <>
                <div className="flex justify-content-between py-1 mt-3">
                  <span className="text-color-secondary">Efectivo contado</span>
                  <span className="font-bold">{formatMoney(resumen.montoCierre)}</span>
                </div>
                <div className="flex justify-content-between py-1">
                  <span className="text-color-secondary">Diferencia</span>
                  <span className="font-bold" style={{ color: (resumen.diferencia ?? 0) < 0 ? "#dc2626" : "#16a34a" }}>
                    {formatMoney(resumen.diferencia)}
                  </span>
                </div>
                {resumen.observacionCierre && <p className="mb-0"><small>{resumen.observacionCierre}</small></p>}
                <Button className="w-full mt-3" label="Abrir nueva caja" icon="pi pi-play-circle" outlined onClick={() => navigate("/apertura-caja")} />
              </>
            ) : (
              <>
                <label className="block mt-3">Efectivo contado</label>
                <InputNumber
                  className="w-full"
                  inputClassName="w-full"
                  value={montoContado}
                  min={0}
                  locale="es-PY"
                  prefix="Gs. "
                  onValueChange={(e) => setMontoContado(e.value ?? null)}
                />
                {diferencia != null && (
                  <div className="flex justify-content-between py-2">
                    <span className="text-color-secondary">{diferencia < 0 ? "Faltante" : diferencia > 0 ? "Sobrante" : "Cuadra"}</span>
                    <span className="font-bold" style={{ color: diferencia < 0 ? "#dc2626" : "#16a34a" }}>
                      {formatMoney(Math.abs(diferencia))}
                    </span>
                  </div>
                )}
                <label className="block mt-2">Observación (opcional)</label>
                <InputTextarea className="w-full" rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                <Button
                  className="w-full mt-3"
                  label="Cerrar caja"
                  icon="pi pi-lock"
                  severity="danger"
                  loading={cerrando}
                  onClick={cerrar}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
