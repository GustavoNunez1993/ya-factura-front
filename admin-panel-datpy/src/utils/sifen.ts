import Swal from "sweetalert2";

const escaparHtml = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Si la empresa tiene envío automático a SIFEN y falló, el back devuelve el motivo en
 * `envioSifenError` (el comprobante igual quedó registrado). Avisa al usuario en vez de dejarlo
 * "Sin enviar" sin explicación.
 */
export const avisarFalloEnvioSifen = async (comprobante: { envioSifenError?: string | null } | null | undefined) => {
  if (!comprobante?.envioSifenError) return;
  await Swal.fire({
    icon: "warning",
    title: "No se pudo enviar a SIFEN",
    html:
      `<div style="text-align:left">El comprobante quedó registrado, pero el envío automático falló:` +
      `<pre style="white-space:pre-wrap;font-size:12px;margin:8px 0">${escaparHtml(comprobante.envioSifenError)}</pre>` +
      `Puede reintentarlo con <b>Enviar a SIFEN</b> desde el listado.</div>`
  });
};
