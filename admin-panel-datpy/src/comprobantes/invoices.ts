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
  condicionVenta: number | null;
  condicionLabel: string;
  clienteRazonSocial: string;
  clienteDocumento: string;
  clienteDireccion?: string;
  items: ComprobanteItem[];
  pagos: ComprobantePago[];
  resumen: ComprobanteResumen;
  totalAbonar: number;
  vuelto: number;
  cdc?: string;
}

function fmtNum(value: number, currency = "PYG"): string {
  return new Intl.NumberFormat("es-PY", {
    style: "decimal",
    maximumFractionDigits: currency === "PYG" ? 0 : 2,
    minimumFractionDigits: currency === "PYG" ? 0 : 2,
  }).format(value || 0);
}

function fmtCdc(cdc?: string): string {
  if (!cdc) return "Documento aún no enviado a SIFEN";
  return cdc.match(/.{1,4}/g)?.join(" ") ?? cdc;
}

// ── Patrón "QR" decorativo ───────────────────────────────────────────────
// No es un QR real (no codifica el CDC) — se dibuja como grilla vectorial de
// 21x21 para que se vea nítido a cualquier zoom, sin rasterizar nada.

const QR_PATTERN_21x21: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 0, y: 0, w: 7, h: 7 }, { x: 1, y: 1, w: 5, h: 5, }, { x: 2, y: 2, w: 3, h: 3 },
  { x: 14, y: 0, w: 7, h: 7 }, { x: 15, y: 1, w: 5, h: 5 }, { x: 16, y: 2, w: 3, h: 3 },
  { x: 0, y: 14, w: 7, h: 7 }, { x: 1, y: 15, w: 5, h: 5 }, { x: 2, y: 16, w: 3, h: 3 },
  { x: 8, y: 6, w: 1, h: 1 }, { x: 10, y: 6, w: 1, h: 1 }, { x: 12, y: 6, w: 1, h: 1 },
  { x: 6, y: 8, w: 1, h: 1 }, { x: 6, y: 10, w: 1, h: 1 }, { x: 6, y: 12, w: 1, h: 1 },
  { x: 8, y: 8, w: 1, h: 1 }, { x: 10, y: 8, w: 1, h: 1 }, { x: 12, y: 8, w: 1, h: 1 },
  { x: 9, y: 9, w: 1, h: 1 }, { x: 11, y: 9, w: 1, h: 1 },
  { x: 8, y: 10, w: 1, h: 1 }, { x: 10, y: 10, w: 2, h: 2 },
  { x: 9, y: 11, w: 1, h: 1 }, { x: 12, y: 11, w: 1, h: 1 },
  { x: 8, y: 12, w: 1, h: 1 }, { x: 11, y: 12, w: 2, h: 1 },
  { x: 14, y: 8, w: 1, h: 1 }, { x: 16, y: 8, w: 1, h: 1 }, { x: 18, y: 8, w: 1, h: 1 }, { x: 20, y: 8, w: 1, h: 1 },
  { x: 15, y: 9, w: 1, h: 1 }, { x: 17, y: 9, w: 1, h: 1 }, { x: 19, y: 9, w: 1, h: 1 },
  { x: 14, y: 10, w: 1, h: 1 }, { x: 16, y: 10, w: 2, h: 1 }, { x: 20, y: 10, w: 1, h: 1 },
  { x: 15, y: 11, w: 1, h: 1 }, { x: 18, y: 11, w: 2, h: 1 },
  { x: 14, y: 12, w: 2, h: 1 }, { x: 17, y: 12, w: 1, h: 1 }, { x: 20, y: 12, w: 1, h: 1 },
  { x: 8, y: 14, w: 1, h: 1 }, { x: 10, y: 14, w: 2, h: 1 }, { x: 13, y: 14, w: 1, h: 1 },
  { x: 9, y: 15, w: 1, h: 1 }, { x: 12, y: 15, w: 1, h: 1 },
  { x: 8, y: 16, w: 2, h: 1 }, { x: 11, y: 16, w: 2, h: 1 },
  { x: 8, y: 17, w: 1, h: 1 }, { x: 10, y: 17, w: 1, h: 1 }, { x: 12, y: 17, w: 1, h: 1 },
  { x: 9, y: 18, w: 2, h: 1 }, { x: 13, y: 18, w: 1, h: 1 },
  { x: 8, y: 19, w: 1, h: 1 }, { x: 11, y: 19, w: 1, h: 1 },
  { x: 9, y: 20, w: 1, h: 1 }, { x: 12, y: 20, w: 1, h: 1 },
  { x: 14, y: 14, w: 2, h: 1 }, { x: 17, y: 14, w: 1, h: 1 }, { x: 19, y: 14, w: 2, h: 1 },
  { x: 15, y: 15, w: 1, h: 1 }, { x: 18, y: 15, w: 1, h: 1 },
  { x: 14, y: 16, w: 1, h: 1 }, { x: 16, y: 16, w: 2, h: 1 }, { x: 20, y: 16, w: 1, h: 1 },
  { x: 15, y: 17, w: 1, h: 1 }, { x: 17, y: 17, w: 1, h: 1 }, { x: 19, y: 17, w: 2, h: 1 },
  { x: 14, y: 18, w: 1, h: 1 }, { x: 16, y: 18, w: 1, h: 1 }, { x: 18, y: 18, w: 1, h: 1 },
  { x: 15, y: 19, w: 2, h: 1 }, { x: 19, y: 19, w: 1, h: 1 },
  { x: 14, y: 20, w: 1, h: 1 }, { x: 17, y: 20, w: 2, h: 1 }, { x: 20, y: 20, w: 1, h: 1 },
  { x: 8, y: 0, w: 1, h: 1 }, { x: 10, y: 0, w: 1, h: 1 }, { x: 12, y: 0, w: 1, h: 1 },
  { x: 9, y: 1, w: 1, h: 1 }, { x: 11, y: 1, w: 2, h: 1 },
  { x: 8, y: 2, w: 2, h: 1 }, { x: 12, y: 2, w: 1, h: 1 },
  { x: 9, y: 3, w: 1, h: 1 }, { x: 11, y: 3, w: 1, h: 1 },
  { x: 8, y: 4, w: 1, h: 1 }, { x: 10, y: 4, w: 2, h: 1 },
  { x: 9, y: 5, w: 1, h: 1 }, { x: 12, y: 5, w: 1, h: 1 },
  { x: 0, y: 8, w: 1, h: 1 }, { x: 2, y: 8, w: 2, h: 1 }, { x: 5, y: 8, w: 1, h: 1 },
  { x: 1, y: 9, w: 1, h: 1 }, { x: 3, y: 9, w: 1, h: 1 },
  { x: 0, y: 10, w: 2, h: 1 }, { x: 4, y: 10, w: 2, h: 1 },
  { x: 1, y: 11, w: 1, h: 1 }, { x: 3, y: 11, w: 1, h: 1 }, { x: 5, y: 11, w: 1, h: 1 },
  { x: 0, y: 12, w: 1, h: 1 }, { x: 2, y: 12, w: 1, h: 1 }, { x: 4, y: 12, w: 1, h: 1 },
];

// ── PDF real (jsPDF, dibujo vectorial nativo) ─────────────────────────────
// Deliberadamente NO usa html2canvas: rasterizar el HTML tenía un bug de
// html2canvas (dependiente de navegador/timing, no reproducible siempre)
// que rotaba números en celdas angostas. Dibujando texto y tabla con las
// primitivas nativas de jsPDF ese bug no puede ocurrir — no hay DOM ni
// canvas de por medio.

export async function descargarBoletaVentaPdf(data: BoletaVentaData): Promise<void> {
  // Se abre ya, en blanco, como primera instrucción — todavía dentro del gesto de click del
  // usuario, para que el navegador no lo bloquee como popup.
  const nuevaVentana = window.open("", "_blank");

  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const { nroDoc, fecha, moneda, condicionVenta, condicionLabel, clienteRazonSocial, clienteDocumento, clienteDireccion, items, resumen, totalAbonar, cdc } = data;

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 10;
  const contentWidth = pageWidth - marginX * 2;
  const negro: [number, number, number] = [17, 17, 17];
  const gris: [number, number, number] = [90, 90, 90];

  pdf.setDrawColor(...negro);
  pdf.setTextColor(...negro);

  const labelValor = (x: number, y: number, label: string, valor: string, fontSize = 9) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", "bold");
    pdf.text(label, x, y);
    const anchoLabel = pdf.getTextWidth(`${label} `);
    pdf.setFont("helvetica", "normal");
    pdf.text(valor, x + anchoLabel, y);
  };

  // ── Tarjeta encabezado ───────────────────────────────────────────────
  const hcY = 10;
  const hcH = 30;
  pdf.setLineWidth(0.5);
  pdf.rect(marginX, hcY, contentWidth, hcH);
  const hcMidX = marginX + contentWidth / 2;
  pdf.line(hcMidX, hcY, hcMidX, hcY + hcH);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("Ya Factura", marginX + 4, hcY + 11);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...gris);
  pdf.text("Sistema Administrativo", marginX + 4, hcY + 16);
  pdf.setTextColor(...negro);
  pdf.setFontSize(7);
  const tagline = pdf.splitTextToSize(
    "Actividades Relacionadas al Analisis y Desarrollo de Sistemas",
    contentWidth / 2 - 8
  );
  pdf.text(tagline, marginX + 4, hcY + 23);

  const hcRightX = hcMidX + 4;
  const hcRightEdge = marginX + contentWidth - 4;
  labelValor(hcRightX, hcY + 6, "Fecha:", fecha.toLocaleDateString("es-PY"), 8);
  labelValor(hcRightX, hcY + 10, "Moneda:", moneda, 8);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.text("FACTURA", hcRightEdge, hcY + 19, { align: "right" });
  pdf.setFontSize(12);
  pdf.text(nroDoc, hcRightEdge, hcY + 26, { align: "right" });

  // ── Tarjeta cliente ──────────────────────────────────────────────────
  const ccY = hcY + hcH + 3;
  const ccH = clienteDireccion ? 30 : 24;
  pdf.setLineWidth(0.5);
  pdf.rect(marginX, ccY, contentWidth, ccH);

  let ly = ccY + 8;
  labelValor(marginX + 4, ly, "Fecha y hora de emisión:", fecha.toLocaleString("es-PY"));
  ly += 6;
  labelValor(marginX + 4, ly, "Nombre o Razón Social:", clienteRazonSocial);
  ly += 6;
  labelValor(marginX + 4, ly, "RUC N° de C.I.:", clienteDocumento);
  if (clienteDireccion) {
    ly += 6;
    labelValor(marginX + 4, ly, "Dirección:", clienteDireccion);
  }

  const ccRightX = hcMidX + 4;
  let ry = ccY + 8;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Condición de venta:", ccRightX, ry);
  let cx = ccRightX + pdf.getTextWidth("Condición de venta: ") + 2;
  const dibujarCheckbox = (x: number, y: number, marcado: boolean, texto: string) => {
    pdf.setFont("helvetica", "normal");
    pdf.text(texto, x, y);
    const w = pdf.getTextWidth(`${texto} `);
    const boxX = x + w;
    const boxSize = 3.2;
    pdf.rect(boxX, y - boxSize + 0.8, boxSize, boxSize);
    if (marcado) {
      pdf.setFont("helvetica", "bold");
      pdf.text("X", boxX + boxSize / 2, y - 0.4, { align: "center" });
    }
    return boxX + boxSize + 4;
  };
  cx = dibujarCheckbox(cx, ry, condicionVenta === 1, "Contado:");
  dibujarCheckbox(cx, ry, condicionVenta !== 1, "Crédito:");
  ry += 8;
  labelValor(ccRightX, ry, "Condición de pago:", condicionLabel, 9);
  ry += 7;
  labelValor(ccRightX, ry, "Moneda:", moneda, 9);

  // ── Tabla de ítems + totales ─────────────────────────────────────────
  autoTable(pdf, {
    startY: ccY + ccH + 3,
    margin: { left: marginX, right: marginX },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.8,
      lineColor: negro,
      lineWidth: 0.3,
      textColor: negro,
      valign: "middle",
    },
    headStyles: { fillColor: [216, 216, 216], textColor: negro, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 20, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 23, halign: "right" },
      4: { cellWidth: 23, halign: "right" },
      5: { cellWidth: 23, halign: "right" },
      6: { cellWidth: 23, halign: "right" },
    },
    head: [["Código", "Descripción", "Cant.", "P. Unit.", "Exentas", "5%", "10%"]],
    body: items.map((item) => [
      item.codigo,
      item.descripcion,
      String(item.cantidad),
      fmtNum(item.precioUnitario, moneda),
      fmtNum(item.exenta, moneda),
      fmtNum(item.iva5, moneda),
      fmtNum(item.iva10, moneda),
    ]),
    foot: [
      [
        { content: "SUBTOTAL:", colSpan: 4, styles: { halign: "left", fontStyle: "bold", fillColor: [239, 239, 239] } },
        { content: fmtNum(resumen.totalExenta, moneda), styles: { halign: "right", fontStyle: "bold", fillColor: [239, 239, 239] } },
        { content: fmtNum(resumen.subtotalIva5, moneda), styles: { halign: "right", fontStyle: "bold", fillColor: [239, 239, 239] } },
        { content: fmtNum(resumen.subtotalIva10, moneda), styles: { halign: "right", fontStyle: "bold", fillColor: [239, 239, 239] } },
      ],
      [
        { content: "TOTAL DE LA OPERACIÓN:", colSpan: 6, styles: { halign: "left", fontStyle: "bold", fontSize: 9.5, fillColor: [224, 224, 224] } },
        { content: fmtNum(totalAbonar, moneda), styles: { halign: "right", fontStyle: "bold", fontSize: 9.5, fillColor: [224, 224, 224] } },
      ],
      [
        { content: "LIQUIDACIÓN IVA:", colSpan: 2, styles: { halign: "left", fontStyle: "bold", fontSize: 7.5, fillColor: [248, 248, 248] } },
        { content: "(5%)", styles: { halign: "center", fontSize: 7.5, fillColor: [248, 248, 248] } },
        { content: fmtNum(resumen.liquidacionIva5, moneda), styles: { halign: "right", fontSize: 7.5, fillColor: [248, 248, 248] } },
        { content: "(10%)", styles: { halign: "center", fontSize: 7.5, fillColor: [248, 248, 248] } },
        { content: fmtNum(resumen.liquidacionIva10, moneda), styles: { halign: "right", fontSize: 7.5, fillColor: [248, 248, 248] } },
        { content: `TOTAL IVA: ${fmtNum(resumen.totalIva, moneda)}`, styles: { halign: "right", fontStyle: "bold", fontSize: 7.5, fillColor: [248, 248, 248] } },
      ],
    ],
  });

  let qrY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

  // ── Sección QR + CDC ─────────────────────────────────────────────────
  const qrBoxSize = 26;
  const qrSectionH = 52;
  if (qrY + qrSectionH > pageHeight - marginX) {
    pdf.addPage();
    qrY = marginX;
  }

  pdf.setLineWidth(0.5);
  pdf.rect(marginX, qrY, contentWidth, qrSectionH);

  const qrBoxX = marginX + 5;
  const qrBoxY = qrY + 5;
  pdf.setDrawColor(150, 150, 150);
  pdf.setLineWidth(0.2);
  pdf.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
  const celda = qrBoxSize / 21;
  pdf.setFillColor(...negro);
  for (const r of QR_PATTERN_21x21) {
    pdf.rect(qrBoxX + r.x * celda, qrBoxY + r.y * celda, r.w * celda, r.h * celda, "F");
  }
  pdf.setDrawColor(...negro);

  const qrInfoX = qrBoxX + qrBoxSize + 8;
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  const consultaTexto = pdf.splitTextToSize(
    "Consulte la validez de este comprobante con el CDC impreso abajo:",
    contentWidth - qrBoxSize - 20
  );
  pdf.text(consultaTexto, qrInfoX, qrY + 9);

  pdf.setFontSize(11);
  const cdcTexto = `${cdc ? "CDC: " : ""}${fmtCdc(cdc)}`;
  const cdcLineas = pdf.splitTextToSize(cdcTexto, contentWidth - qrBoxSize - 20);
  pdf.text(cdcLineas, qrInfoX, qrY + 9 + consultaTexto.length * 5 + 4);

  const legalY = qrY + qrBoxSize + 10;
  pdf.setLineWidth(0.2);
  pdf.setDrawColor(180, 180, 180);
  pdf.line(marginX + 4, legalY, marginX + contentWidth - 4, legalY);
  pdf.setDrawColor(...negro);

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("ESTE DOCUMENTO ES UNA REPRESENTACIÓN GRÁFICA DE UN COMPROBANTE DE VENTA", marginX + 4, legalY + 5);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "Si este comprobante presenta algún error, podrá solicitar su corrección dentro de las 48 horas siguientes a la emisión.",
    marginX + 4,
    legalY + 10
  );
  pdf.text("Gracias por su compra", marginX + 4, legalY + 15);

  const blobUrl = URL.createObjectURL(pdf.output("blob"));

  // Ni window.open(blobUrl) ni <a target="_blank" href="dataUri"> navegan de forma confiable
  // a nivel superior en Chromium (quedan en about:blank o ni siquiera abren pestaña — son
  // restricciones conocidas de ese navegador para navegación de nivel superior a blob:/data:).
  // Insertar un <iframe> apuntando a la URL blob: dentro de la pestaña ya abierta sí funciona,
  // porque es una carga de subrecurso, no una navegación de nivel superior.
  if (nuevaVentana) {
    nuevaVentana.document.title = `Factura ${nroDoc}`;
    nuevaVentana.document.body.style.margin = "0";
    const visor = nuevaVentana.document.createElement("iframe");
    visor.src = blobUrl;
    visor.style.width = "100vw";
    visor.style.height = "100vh";
    visor.style.border = "none";
    nuevaVentana.document.body.appendChild(visor);
  } else {
    // Popup bloqueado por el navegador: se recurre a la descarga directa.
    pdf.save(`factura-${nroDoc}.pdf`);
  }
}
