import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";

import { useAuth } from "../../context/AuthContext";
import type { CajaResumen, LineaMonto, MontoMonedaCaja } from "../../services/CajaAperturaCierreService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";
import { nombreTipoDocumento } from "../../services/FacturaService";
import { NRO_CAJA } from "../../utils/caja";
import { decimalesMoneda, formatMonto, prefijoMoneda } from "../../utils/moneda";
import { usePermisos } from "../../hooks/usePermisos";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatFecha = (value?: string | null) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-PY") : "-");

/** Totales de varias monedas, uno por renglón (nunca se suman entre sí). */
function Totales({ montos }: { montos: MontoMonedaCaja[] }) {
  const lista = montos.length > 0 ? montos : [{ moneda: "PYG", monto: 0 }];
  return (
    <div className="text-right">
      {lista.map((m) => (
        <div key={m.moneda}>{formatMonto(m.monto, m.moneda)}</div>
      ))}
    </div>
  );
}

function TablaMontos({ titulo, lineas, totales, vacio }: { titulo: string; lineas: LineaMonto[]; totales: MontoMonedaCaja[]; vacio: string }) {
  return (
    <div className="surface-card border-1 surface-border border-round p-3 h-full">
      <div className="font-semibold mb-2">{titulo}</div>
      {lineas.length === 0 ? (
        <small className="text-color-secondary">{vacio}</small>
      ) : (
        lineas.map((l) => (
          <div
            key={`${l.forma}-${l.moneda}`}
            className="flex justify-content-between py-1"
            style={{ borderBottom: "1px dashed var(--surface-border)" }}
          >
            <span className="text-color-secondary" style={{ textTransform: "capitalize" }}>{l.forma.toLowerCase()}</span>
            <span className="font-medium">{formatMonto(l.monto, l.moneda)}</span>
          </div>
        ))
      )}
      <div className="flex justify-content-between pt-2 font-bold">
        <span>Total</span>
        <Totales montos={totales} />
      </div>
    </div>
  );
}

const textoDiferencia = (diferencia: number, moneda: string) =>
  diferencia === 0
    ? `${moneda}: cuadra`
    : diferencia < 0
      ? `${moneda}: faltante de ${formatMonto(-diferencia, moneda)}`
      : `${moneda}: sobrante de ${formatMonto(diferencia, moneda)}`;

/**
 * Arqueo y cierre de la caja abierta: muestra lo cobrado (ventas contado, neto de vuelto, y
 * cobros de cuenta corriente), lo pagado (reintegros, autofacturas) por forma de pago y moneda,
 * y el efectivo que debería haber de cada moneda. Al cerrar se registra el efectivo contado de
 * cada moneda y su diferencia; desde ahí ya no se pueden emitir comprobantes hasta la próxima apertura.
 */
export default function CierreCajaPage() {
  // Acciones según el rol (el back valida igual cada una).
  const { puede } = usePermisos();
  const navigate = useNavigate();
  // Desde el listado de aperturas se cierra una caja puntual; sin parámetro, la caja abierta.
  const [searchParams] = useSearchParams();
  const aperturaId = searchParams.get("aperturaId");
  const { user } = useAuth();

  const [resumen, setResumen] = useState<CajaResumen | null>(null);
  const [sinCaja, setSinCaja] = useState(false);
  const [cargando, setCargando] = useState(true);
  // Efectivo contado por moneda (ISO 4217).
  const [contado, setContado] = useState<Record<string, number | null>>({});
  const [observacion, setObservacion] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const id = aperturaId ?? (await CajaAperturaCierreService.getCajaAbierta(NRO_CAJA)).id;
      setResumen(await CajaAperturaCierreService.getResumen(id));
      setSinCaja(false);
    } catch {
      setResumen(null);
      setSinCaja(true);
    } finally {
      setCargando(false);
    }
  }, [aperturaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const diferenciaDe = (moneda: string, esperado: number) => {
    const valor = contado[moneda];
    return valor == null ? null : Math.round((valor - esperado) * 100) / 100;
  };

  const cerrar = async () => {
    if (!resumen) return;
    const faltan = resumen.arqueo.filter((a) => contado[a.moneda] == null || (contado[a.moneda] ?? 0) < 0);
    if (faltan.length > 0) {
      Swal.fire("Atención", `Ingresá el efectivo contado en ${faltan.map((a) => a.moneda).join(", ")}.`, "info");
      return;
    }
    const diferencias = resumen.arqueo.map((a) => ({ moneda: a.moneda, valor: diferenciaDe(a.moneda, a.efectivoEsperado)! }));
    const cuadraTodo = diferencias.every((d) => d.valor === 0);
    const detalle = diferencias.map((d) => textoDiferencia(d.valor, d.moneda)).join("<br/>");
    const { isConfirmed } = await Swal.fire({
      icon: cuadraTodo ? "question" : "warning",
      title: `¿Cerrar la caja ${resumen.nroCaja}?`,
      html: `${detalle}<br/><small>Después del cierre no se pueden emitir comprobantes hasta abrir una nueva caja.</small>`,
      showCancelButton: true,
      confirmButtonText: "Cerrar caja",
      cancelButtonText: "Volver"
    });
    if (!isConfirmed) return;

    try {
      setCerrando(true);
      const usuarioId = (user as { id?: unknown } | null)?.id;
      const efectivo = Object.fromEntries(resumen.arqueo.map((a) => [a.moneda, contado[a.moneda] ?? 0]));
      const cerrada = await CajaAperturaCierreService.cerrar(
        resumen.aperturaId,
        efectivo,
        observacion.trim() || undefined,
        typeof usuarioId === "string" && UUID_RE.test(usuarioId) ? usuarioId : undefined
      );
      setResumen(cerrada);
      await Swal.fire("Caja cerrada", detalle, "success");
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
            Abierta el {formatFecha(resumen.fechaApertura)} · Monto de apertura {formatMonto(resumen.montoApertura, "PYG")}
          </small>
        </div>
        <Tag value={resumen.estado} severity={cerrada ? "secondary" : "success"} />
      </div>

      <div className="grid">
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Ventas contado" lineas={resumen.ventasPorForma} totales={resumen.totalVentas} vacio="Sin ventas contado" />
        </div>
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Cobros de cuenta corriente" lineas={resumen.cobrosCuentaCorriente} totales={resumen.totalCobros} vacio="Sin cobros" />
        </div>
        <div className="col-12 md:col-4">
          <TablaMontos titulo="Salidas (reintegros, autofacturas)" lineas={resumen.egresosPorForma} totales={resumen.totalEgresos} vacio="Sin salidas" />
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
                    <tr style={{ textAlign: "left", borderBottom: "1px solid var(--surface-border)" }}>
                      <th style={{ padding: 4 }}>Tipo</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Emitidos</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Anulados</th>
                      <th style={{ padding: 4, textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.comprobantes.map((c) => (
                      <tr key={c.tipo} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                        <td style={{ padding: 4, verticalAlign: "top" }}>{nombreTipoDocumento(c.tipo)}</td>
                        <td style={{ padding: 4, textAlign: "right", verticalAlign: "top" }}>{c.emitidos}</td>
                        <td style={{ padding: 4, textAlign: "right", verticalAlign: "top" }}>{c.anulados}</td>
                        <td style={{ padding: 4, textAlign: "right" }}>
                          {c.tipo === 7 ? "-" : <Totales montos={c.totales} />}
                        </td>
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
            <div className="font-semibold mb-1">Arqueo de efectivo</div>
            <small className="text-color-secondary">
              Cada moneda se cuenta por separado. Guaraníes: apertura + ventas y cobros en efectivo − salidas en efectivo.
            </small>

            {resumen.arqueo.map((a) => {
              const diferencia = cerrada ? a.diferencia : diferenciaDe(a.moneda, a.efectivoEsperado);
              const decimales = decimalesMoneda(a.moneda);
              return (
                <div key={a.moneda} className="mt-3 pt-2" style={{ borderTop: "1px solid var(--surface-border)" }}>
                  <div className="flex justify-content-between align-items-center">
                    <span className="font-semibold">{a.moneda}</span>
                    <span>
                      <span className="text-color-secondary mr-2">Esperado</span>
                      <span className="text-lg font-bold">{formatMonto(a.efectivoEsperado, a.moneda)}</span>
                    </span>
                  </div>

                  {cerrada ? (
                    <div className="flex justify-content-between py-1">
                      <span className="text-color-secondary">Contado</span>
                      <span className="font-bold">{a.montoContado == null ? "-" : formatMonto(a.montoContado, a.moneda)}</span>
                    </div>
                  ) : (
                    <>
                      <label className="block mt-2">Efectivo contado en {a.moneda}</label>
                      <InputNumber
                        className="w-full"
                        inputClassName="w-full"
                        value={contado[a.moneda] ?? null}
                        min={0}
                        locale="es-PY"
                        prefix={prefijoMoneda(a.moneda)}
                        minFractionDigits={decimales}
                        maxFractionDigits={decimales}
                        onValueChange={(e) => setContado((prev) => ({ ...prev, [a.moneda]: e.value ?? null }))}
                      />
                    </>
                  )}

                  {diferencia != null && (
                    <div className="flex justify-content-between py-1">
                      <span className="text-color-secondary">
                        {diferencia < 0 ? "Faltante" : diferencia > 0 ? "Sobrante" : "Cuadra"}
                      </span>
                      <span className="font-bold" style={{ color: diferencia < 0 ? "#dc2626" : "#16a34a" }}>
                        {formatMonto(Math.abs(diferencia), a.moneda)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {cerrada ? (
              <>
                {resumen.observacionCierre && <p className="mb-0 mt-3"><small>{resumen.observacionCierre}</small></p>}
                <Button className="w-full mt-3" label="Abrir nueva caja" icon="pi pi-play-circle" outlined onClick={() => navigate("/apertura-caja")} />
              </>
            ) : (
              <>
                <label className="block mt-3">Observación (opcional)</label>
                <InputTextarea className="w-full" rows={2} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                {puede("CIERRE_CAJA", "CERRAR") && (
                <Button
                  className="w-full mt-3"
                  label="Cerrar caja"
                  icon="pi pi-lock"
                  severity="danger"
                  loading={cerrando}
                  onClick={cerrar}
                />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
