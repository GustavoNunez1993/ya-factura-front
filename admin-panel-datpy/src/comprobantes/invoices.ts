// ── Types ──────────────────────────────────────────────────────────────────

export interface ComprobanteItem {
  codigo: string;
  descripcion: string;
  cantidad: string | number;
  precioUnitario: number;
  exenta: number;
  iva5: number;
  iva10: number;
}

export interface ComprobantePago {
  formaPago: string;
  referencia: string;
  monto: number;
}

export interface ComprobanteResumen {
  totalExenta: number;
  subtotalIva5: number;
  subtotalIva10: number;
  liquidacionIva5: number;
  liquidacionIva10: number;
  totalIva: number;
}

export interface BoletaVentaData {
  puntoExpedicion: string;
  nroDoc: string;
  fecha: Date;
  moneda: string;
  condicionVenta: string;
  condicionLabel: string;
  clienteRazonSocial: string;
  clienteDocumento: string;
  clienteDireccion?: string;
  items: ComprobanteItem[];
  pagos: ComprobantePago[];
  resumen: ComprobanteResumen;
  totalAbonar: number;
  vuelto: number;
}



function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fmtNum(value: number, currency = "PYG"): string {
  return new Intl.NumberFormat("es-PY", {
    style: "decimal",
    maximumFractionDigits: currency === "PYG" ? 0 : 2,
    minimumFractionDigits: currency === "PYG" ? 0 : 2,
  }).format(value || 0);
}



// ── QR placeholder SVG ─────────────────────────────────────────────────────

const QR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="130" height="130" shape-rendering="crispEdges">
<rect width="21" height="21" fill="white"/>
<rect x="0" y="0" width="7" height="7" fill="black"/><rect x="1" y="1" width="5" height="5" fill="white"/><rect x="2" y="2" width="3" height="3" fill="black"/>
<rect x="14" y="0" width="7" height="7" fill="black"/><rect x="15" y="1" width="5" height="5" fill="white"/><rect x="16" y="2" width="3" height="3" fill="black"/>
<rect x="0" y="14" width="7" height="7" fill="black"/><rect x="1" y="15" width="5" height="5" fill="white"/><rect x="2" y="16" width="3" height="3" fill="black"/>
<rect x="8" y="6" width="1" height="1" fill="black"/><rect x="10" y="6" width="1" height="1" fill="black"/><rect x="12" y="6" width="1" height="1" fill="black"/>
<rect x="6" y="8" width="1" height="1" fill="black"/><rect x="6" y="10" width="1" height="1" fill="black"/><rect x="6" y="12" width="1" height="1" fill="black"/>
<rect x="8" y="8" width="1" height="1" fill="black"/><rect x="10" y="8" width="1" height="1" fill="black"/><rect x="12" y="8" width="1" height="1" fill="black"/>
<rect x="9" y="9" width="1" height="1" fill="black"/><rect x="11" y="9" width="1" height="1" fill="black"/>
<rect x="8" y="10" width="1" height="1" fill="black"/><rect x="10" y="10" width="2" height="2" fill="black"/>
<rect x="9" y="11" width="1" height="1" fill="black"/><rect x="12" y="11" width="1" height="1" fill="black"/>
<rect x="8" y="12" width="1" height="1" fill="black"/><rect x="11" y="12" width="2" height="1" fill="black"/>
<rect x="14" y="8" width="1" height="1" fill="black"/><rect x="16" y="8" width="1" height="1" fill="black"/><rect x="18" y="8" width="1" height="1" fill="black"/><rect x="20" y="8" width="1" height="1" fill="black"/>
<rect x="15" y="9" width="1" height="1" fill="black"/><rect x="17" y="9" width="1" height="1" fill="black"/><rect x="19" y="9" width="1" height="1" fill="black"/>
<rect x="14" y="10" width="1" height="1" fill="black"/><rect x="16" y="10" width="2" height="1" fill="black"/><rect x="20" y="10" width="1" height="1" fill="black"/>
<rect x="15" y="11" width="1" height="1" fill="black"/><rect x="18" y="11" width="2" height="1" fill="black"/>
<rect x="14" y="12" width="2" height="1" fill="black"/><rect x="17" y="12" width="1" height="1" fill="black"/><rect x="20" y="12" width="1" height="1" fill="black"/>
<rect x="8" y="14" width="1" height="1" fill="black"/><rect x="10" y="14" width="2" height="1" fill="black"/><rect x="13" y="14" width="1" height="1" fill="black"/>
<rect x="9" y="15" width="1" height="1" fill="black"/><rect x="12" y="15" width="1" height="1" fill="black"/>
<rect x="8" y="16" width="2" height="1" fill="black"/><rect x="11" y="16" width="2" height="1" fill="black"/>
<rect x="8" y="17" width="1" height="1" fill="black"/><rect x="10" y="17" width="1" height="1" fill="black"/><rect x="12" y="17" width="1" height="1" fill="black"/>
<rect x="9" y="18" width="2" height="1" fill="black"/><rect x="13" y="18" width="1" height="1" fill="black"/>
<rect x="8" y="19" width="1" height="1" fill="black"/><rect x="11" y="19" width="1" height="1" fill="black"/>
<rect x="9" y="20" width="1" height="1" fill="black"/><rect x="12" y="20" width="1" height="1" fill="black"/>
<rect x="14" y="14" width="2" height="1" fill="black"/><rect x="17" y="14" width="1" height="1" fill="black"/><rect x="19" y="14" width="2" height="1" fill="black"/>
<rect x="15" y="15" width="1" height="1" fill="black"/><rect x="18" y="15" width="1" height="1" fill="black"/>
<rect x="14" y="16" width="1" height="1" fill="black"/><rect x="16" y="16" width="2" height="1" fill="black"/><rect x="20" y="16" width="1" height="1" fill="black"/>
<rect x="15" y="17" width="1" height="1" fill="black"/><rect x="17" y="17" width="1" height="1" fill="black"/><rect x="19" y="17" width="2" height="1" fill="black"/>
<rect x="14" y="18" width="1" height="1" fill="black"/><rect x="16" y="18" width="1" height="1" fill="black"/><rect x="18" y="18" width="1" height="1" fill="black"/>
<rect x="15" y="19" width="2" height="1" fill="black"/><rect x="19" y="19" width="1" height="1" fill="black"/>
<rect x="14" y="20" width="1" height="1" fill="black"/><rect x="17" y="20" width="2" height="1" fill="black"/><rect x="20" y="20" width="1" height="1" fill="black"/>
<rect x="8" y="0" width="1" height="1" fill="black"/><rect x="10" y="0" width="1" height="1" fill="black"/><rect x="12" y="0" width="1" height="1" fill="black"/>
<rect x="9" y="1" width="1" height="1" fill="black"/><rect x="11" y="1" width="2" height="1" fill="black"/>
<rect x="8" y="2" width="2" height="1" fill="black"/><rect x="12" y="2" width="1" height="1" fill="black"/>
<rect x="9" y="3" width="1" height="1" fill="black"/><rect x="11" y="3" width="1" height="1" fill="black"/>
<rect x="8" y="4" width="1" height="1" fill="black"/><rect x="10" y="4" width="2" height="1" fill="black"/>
<rect x="9" y="5" width="1" height="1" fill="black"/><rect x="12" y="5" width="1" height="1" fill="black"/>
<rect x="0" y="8" width="1" height="1" fill="black"/><rect x="2" y="8" width="2" height="1" fill="black"/><rect x="5" y="8" width="1" height="1" fill="black"/>
<rect x="1" y="9" width="1" height="1" fill="black"/><rect x="3" y="9" width="1" height="1" fill="black"/>
<rect x="0" y="10" width="2" height="1" fill="black"/><rect x="4" y="10" width="2" height="1" fill="black"/>
<rect x="1" y="11" width="1" height="1" fill="black"/><rect x="3" y="11" width="1" height="1" fill="black"/><rect x="5" y="11" width="1" height="1" fill="black"/>
<rect x="0" y="12" width="1" height="1" fill="black"/><rect x="2" y="12" width="1" height="1" fill="black"/><rect x="4" y="12" width="1" height="1" fill="black"/>
</svg>`;

// ── HTML Generator ─────────────────────────────────────────────────────────

export function generarBoletaVentaHtml(data: BoletaVentaData): string {
  const {
     nroDoc, fecha, moneda,
    condicionVenta, condicionLabel,
    clienteRazonSocial, clienteDocumento, clienteDireccion,
    items, resumen, totalAbonar
  } = data;

  const itemsHtml = items.map((item) => `
    <tr>
      <td class="c">${esc(item.codigo)}</td>
      <td>${esc(item.descripcion)}</td>
      <td class="c">${esc(item.cantidad)}</td>
      <td class="r">${esc(fmtNum(item.precioUnitario, moneda))}</td>
      <td class="r">${esc(fmtNum(item.exenta, moneda))}</td>
      <td class="r">${esc(fmtNum(item.iva5, moneda))}</td>
      <td class="r">${esc(fmtNum(item.iva10, moneda))}</td>
    </tr>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Boleta de venta</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 20px; color: #111; font-family: Arial, sans-serif; font-size: 11px; background: #f0f0f0; }
    .page { max-width: 950px; margin: 0 auto; background: #fff; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .print-btn {
      display: block; margin: 16px auto 0; padding: 10px 32px;
      background: #1d4ed8; color: #fff; border: none; border-radius: 6px;
      font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: .3px;
    }
    .print-btn:hover { background: #1e40af; }

    /* HEADER CARD */
    .header-card {
      display: grid; grid-template-columns: 1fr 1fr;
      border: 2px solid #222; border-radius: 6px; overflow: hidden; margin-bottom: 8px;
    }
    .hc-left { padding: 14px 18px; border-right: 2px solid #222; }
    .brand-name { font-size: 28px; font-weight: 900; letter-spacing: 1px; line-height: 1.1; }
    .brand-tagline { font-size: 10px; color: #555; margin-bottom: 10px; }
    .brand-info-table { border: none; font-size: 10px; color: #333; }
    .brand-info-table td { padding: 1px 4px 1px 0; border: none; }
    .hc-right {
      padding: 10px 18px; display: flex; flex-direction: column;
      align-items: flex-end; justify-content: center; gap: 4px;
    }
    .doc-meta-table { border: none; font-size: 10px; color: #333; margin-bottom: 6px; }
    .doc-meta-table td { padding: 1px 6px; border: none; }
    .doc-meta-table td:last-child { font-weight: 700; text-align: right; }
    .doc-type-title { font-size: 15px; font-weight: 700; text-align: center; }
    .doc-number { font-size: 14px; font-weight: 700; text-align: center; }

    /* CLIENT CARD */
    .client-card {
      display: grid; grid-template-columns: 1fr 1fr;
      border: 2px solid #222; border-radius: 6px; overflow: hidden;
      margin-bottom: 8px; padding: 10px 18px; gap: 8px 24px;
      line-height: 1.9; font-size: 11px;
    }
    .client-card .lbl { font-weight: 700; }
    .cond-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .cond-chk {
      border: 2px solid #222; width: 16px; height: 16px;
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; line-height: 1;
    }

    /* MAIN TABLE */
    .main-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .main-table th, .main-table td { border: 1.5px solid #222; padding: 5px 7px; vertical-align: middle; }
    .main-table thead tr { background: #d8d8d8; }
    .main-table th { font-weight: 700; font-size: 10px; text-align: center; }
    .main-table td.c { text-align: center; }
    .main-table td.r { text-align: right; white-space: nowrap; }
    .main-table td.bold { font-weight: 700; }
    .row-subtotal td { background: #efefef; font-weight: 700; }
    .row-total td { background: #e0e0e0; font-weight: 700; font-size: 12px; }
    .row-iva td { font-size: 10px; background: #f8f8f8; }

    /* VUELTO */
    .vuelto-row {
      text-align: right; font-weight: 700; font-size: 12px; padding: 6px 4px 10px;
      border-top: 1.5px solid #222;
    }

    /* QR SECTION */
    .qr-section { border: 2px solid #222; border-radius: 4px; padding: 12px 16px; margin-bottom: 8px; }
    .qr-inner { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 10px; }
    .qr-svg-wrap { flex-shrink: 0; border: 1px solid #999; padding: 4px; background: white; }
    .qr-info { flex: 1; font-size: 11px; line-height: 1.6; }
    .qr-info p { margin-bottom: 6px; }
    .qr-ref-label { font-weight: 700; font-size: 11px; }
    .cdc-number { font-size: 15px; font-weight: 700; letter-spacing: 1px; word-break: break-all; margin-top: 6px; }
    .legal-block { font-size: 10px; color: #333; line-height: 1.6; border-top: 1px solid #bbb; padding-top: 8px; }
    .legal-block p { margin-bottom: 3px; }

    @page { size: A4; margin: 10mm; }
    @media print {
      body { padding: 0; background: white; }
      .page { max-width: none; box-shadow: none; padding: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER CARD -->
  <div class="header-card">
    <div class="hc-left">
      <div class="brand-name">Ya Factura</div>
      <div class="brand-tagline">Sistema Administrativo</div>
      <table class="brand-info-table">
        <tr><td>Actividades Relacionadas al Analisis y Desarrollo de Sistemas</td></tr>
      </table>
    </div>
    <div class="hc-right">
      <table class="doc-meta-table">
        <tr><td>Fecha:</td><td>${esc(fecha.toLocaleDateString("es-PY"))}</td></tr>
        <tr><td>Moneda:</td><td>${esc(moneda)}</td></tr>
      </table>
      <div class="doc-type-title">FACTURA</div>
      <div class="doc-number">${esc(nroDoc)}</div>
    </div>
  </div>

  <!-- CLIENT CARD -->
  <div class="client-card">
    <div>
      <div><span class="lbl">Fecha y hora de emisión:</span> ${esc(fecha.toLocaleString("es-PY"))}</div>
      <div><span class="lbl">Nombre o Razón Social:</span> ${esc(clienteRazonSocial)}</div>
      <div><span class="lbl">RUC N° de C.I.:</span> ${esc(clienteDocumento)}</div>
      ${clienteDireccion ? `<div><span class="lbl">Dirección:</span> ${esc(clienteDireccion)}</div>` : ""}
    </div>
    <div>
      <div class="cond-inline">
        <span class="lbl">Condición de venta:</span>
        Contado: <span class="cond-chk">${condicionVenta === "CONTADO" ? "X" : "&nbsp;"}</span>
        Crédito: <span class="cond-chk">${condicionVenta !== "CONTADO" ? "X" : "&nbsp;"}</span>
      </div>
      <div><span class="lbl">Condición de pago:</span> ${esc(condicionLabel)}</div>
      <div><span class="lbl">Moneda:</span> ${esc(moneda)}</div>
    </div>
  </div>

  <!-- PRODUCTOS + TOTALES + IVA -->
  <table class="main-table">
    <thead>
      <tr>
        <th style="width:70px">Código</th>
        <th>Descripción</th>
        <th style="width:50px">Cant.</th>
        <th style="width:90px">P. Unit.</th>
        <th style="width:90px">Exentas</th>
        <th style="width:90px">5%</th>
        <th style="width:90px">10%</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr class="row-subtotal">
        <td colspan="4" class="bold">SUBTOTAL:</td>
        <td class="r">${esc(fmtNum(resumen.totalExenta, moneda))}</td>
        <td class="r">${esc(fmtNum(resumen.subtotalIva5, moneda))}</td>
        <td class="r">${esc(fmtNum(resumen.subtotalIva10, moneda))}</td>
      </tr>
      <tr class="row-total">
        <td colspan="6" class="bold">TOTAL DE LA OPERACIÓN:</td>
        <td class="r">${esc(fmtNum(totalAbonar, moneda))}</td>
      </tr>
      <tr class="row-iva">
        <td colspan="2" class="bold">LIQUIDACIÓN IVA:</td>
        <td class="c">(5%)</td>
        <td class="r">${esc(fmtNum(resumen.liquidacionIva5, moneda))}</td>
        <td class="c">(10%)</td>
        <td class="r">${esc(fmtNum(resumen.liquidacionIva10, moneda))}</td>
        <td class="r bold">TOTAL IVA: ${esc(fmtNum(resumen.totalIva, moneda))}</td>
      </tr>
    </tfoot>
  </table>

  <!-- SECCIÓN QR -->
  <div class="qr-section">
    <div class="qr-inner">
      <div class="qr-svg-wrap">${QR_SVG}</div>
      <div class="qr-info">
        <p class="qr-ref-label">Consulte la validez de este comprobante con el número de referencia impreso abajo:</p>
        <p class="cdc-number">REF: 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000</p>
      </div>
    </div>
    <div class="legal-block">
      <p><strong>ESTE DOCUMENTO ES UNA REPRESENTACIÓN GRÁFICA DE UN COMPROBANTE DE VENTA</strong></p>
      <p>Si este comprobante presenta algún error, podrá solicitar su corrección dentro de las 48 horas siguientes a la emisión.</p>
      <p>Gracias por su compra</p>
    </div>
  </div>

</div>
<button class="print-btn" onclick="window.print()">&#128438; Imprimir / Guardar PDF</button>
</body>
</html>`;
}

// ── PDF opener ─────────────────────────────────────────────────────────────

export function abrirBoletaVenta(data: BoletaVentaData): void {
  const html = generarBoletaVentaHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  window.open(URL.createObjectURL(blob), "_blank");
}
