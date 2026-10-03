import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";
import { FacturaService } from "../../services/FacturaService";
import type { RespuestaSifenDetalle } from "../../services/FacturaService";

interface Props {
  /** Factura cuyo detalle se muestra; null cierra el diálogo. */
  factura: { id: string; numeracion: string } | null;
  onHide: () => void;
}

/** Empareja los códigos ("1305,2008") con sus mensajes ("msg1 | msg2") tal como los guarda SIFEN. */
function paresCodigoMensaje(codigo: string | null, mensaje: string | null) {
  const codigos = (codigo ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  const mensajes = (mensaje ?? "").split(" | ").map((m) => m.trim()).filter(Boolean);
  if (codigos.length > 0 && codigos.length === mensajes.length) {
    return codigos.map((c, i) => ({ codigo: c, mensaje: mensajes[i] }));
  }
  // Cantidades distintas: se muestran tal cual, sin forzar el emparejamiento.
  if (codigos.length === 0 && mensajes.length === 0) return [];
  return [{ codigo: codigos.join(", "), mensaje: mensajes.join(" | ") }];
}

function severidad(estado: string) {
  if (estado.startsWith("APROBADO")) return "success";
  if (["RECHAZADO", "CANCELADO", "ERROR_DEFINITIVO", "FIRMA_RECHAZADA", "VALIDACION_RECHAZADA"].includes(estado)) return "danger";
  return "warning";
}

/** Popup con el detalle de la última respuesta de SIFEN de un comprobante. */
export default function SifenRespuestaDialog({ factura, onHide }: Props) {
  const [detalle, setDetalle] = useState<RespuestaSifenDetalle | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verXml, setVerXml] = useState(false);

  useEffect(() => {
    if (!factura) return;
    setDetalle(null);
    setError(null);
    setVerXml(false);
    setCargando(true);
    FacturaService.respuestaSifen(factura.id)
      .then(setDetalle)
      .catch((e) => setError(e?.response?.data?.message ?? "No se pudo obtener la respuesta de SIFEN"))
      .finally(() => setCargando(false));
  }, [factura]);

  const estado = (detalle?.estadoSifen ?? "").toUpperCase();
  const pares = detalle ? paresCodigoMensaje(detalle.codigo, detalle.mensaje) : [];

  return (
    <Dialog
      header={`Respuesta de SIFEN${factura ? ` — ${factura.numeracion}` : ""}`}
      visible={factura !== null}
      onHide={onHide}
      style={{ width: "44rem" }}
      breakpoints={{ "768px": "95vw" }}
      dismissableMask
    >
      {cargando && <p className="text-600">Cargando…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {detalle && (
        <div className="flex flex-column gap-3">
          <div className="flex align-items-center gap-2 flex-wrap">
            <span className="font-semibold">Estado:</span>
            <Tag value={estado || "—"} severity={severidad(estado) as any} />
          </div>

          <div>
            <div className="font-semibold mb-2">Detalle de SIFEN</div>
            {pares.length === 0 ? (
              <p className="text-600 m-0">SIFEN todavía no devolvió una respuesta para este comprobante.</p>
            ) : (
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="text-left text-600">
                    <th className="py-1 pr-3" style={{ width: "6rem" }}>Código</th>
                    <th className="py-1">Mensaje</th>
                  </tr>
                </thead>
                <tbody>
                  {pares.map((p, i) => (
                    <tr key={i} className="border-top-1 surface-border">
                      <td className="py-2 pr-3 font-mono align-top">{p.codigo || "—"}</td>
                      <td className="py-2">{p.mensaje || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid m-0 text-sm">
            <div className="col-12 md:col-3 p-0 font-semibold">CDC</div>
            <div className="col-12 md:col-9 p-0 font-mono" style={{ wordBreak: "break-all" }}>{detalle.cdc ?? "—"}</div>
            <div className="col-12 md:col-3 p-0 pt-2 font-semibold">Protocolo</div>
            <div className="col-12 md:col-9 p-0 pt-2 font-mono">{detalle.protocolo ?? "—"}</div>
          </div>

          {detalle.xmlRespuesta && (
            <div>
              <Button
                label={verXml ? "Ocultar XML de la respuesta" : "Ver XML de la respuesta"}
                icon={verXml ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                link
                className="p-0"
                onClick={() => setVerXml((v) => !v)}
              />
              {verXml && (
                <pre
                  className="surface-100 border-round p-2 mt-2 text-xs overflow-auto"
                  style={{ maxHeight: "18rem", whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                >
                  {detalle.xmlRespuesta}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
