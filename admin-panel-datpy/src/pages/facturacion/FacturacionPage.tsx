import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";

import { PersonaService } from "../../services/PersonaService";
import { ProductosService } from "../../services/ProductosService";
import { FacturaService } from "../../services/FacturaService";

interface Persona {
  id: string;
  razonSocial: string;
  ruc?: string;
  dv?: string;
  nroDocumento?: string;
}

interface Producto {
  id: string;
  codigo: string;
  codigoBarra?: string;
  descripcion: string;
  precioVenta: number | null;
  porcentajeIva: number | null;
}

interface FacturaItem {
  id: string;
  productoId: string;
  codigo: string;
  cantidad: number;
  descripcion: string;
  precioUnitario: number;
  precioUnitarioBase: number;
  porcentajeIva: number;
  exenta: number;
  iva5: number;
  iva10: number;
}

interface PagoItem {
  id: string;
  formaPago: string;
  monto: number;
  referencia: string;
}

const condicionesVenta = [
  { label: "Contado", value: "CONTADO" },
  { label: "Crédito", value: "CREDITO" }
];

const monedas = [
  { label: "Guaraníes", value: "PYG" },
  { label: "Dólares", value: "USD" },
  { label: "Reales", value: "BRL" },
  { label: "Euros", value: "EUR" }
];

const cotizaciones: Record<string, number> = {
  PYG: 1,
  USD: 6500,
  BRL: 2800,
  EUR: 6800
};

const formasPago = [
  { label: "Efectivo", value: "EFECTIVO" },
  { label: "Tarjeta", value: "TARJETA" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Transferencia", value: "TRANSFERENCIA" },
  { label: "QR", value: "QR" },
  { label: "Billetera", value: "BILLETERA" },
  { label: "Otro", value: "OTRO" }
];

const formatMoney = (value: number, currency = "PYG") =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "PYG" ? 0 : 2
  }).format(value || 0);

const convertirDesdeGuaranies = (value: number, currency = "PYG") =>
  value / (cotizaciones[currency] ?? 1);

const convertirAGuaranies = (value: number, currency = "PYG") =>
  value * (cotizaciones[currency] ?? 1);

const monedaPrefix = (currency = "PYG") => {
  if (currency === "PYG") return "Gs. ";
  if (currency === "USD") return "US$ ";
  if (currency === "BRL") return "R$ ";
  if (currency === "EUR") return "€ ";
  return "";
};

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return startOfDay(value);
};

const recalcularItem = (item: FacturaItem): FacturaItem => {
  const subtotal = item.cantidad * item.precioUnitario;

  return {
    ...item,
    exenta: item.porcentajeIva === 0 ? subtotal : 0,
    iva5: item.porcentajeIva === 5 ? subtotal : 0,
    iva10: item.porcentajeIva === 10 ? subtotal : 0
  };
};

export default function FacturacionPage() {
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const fechaMinima = useMemo(() => addDays(hoy, -29), [hoy]);
  const fechaMaxima = useMemo(() => addDays(hoy, 5), [hoy]);

  const [clientes, setClientes] = useState<Persona[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [fecha, setFecha] = useState<Date>(hoy);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [condicionVenta, setCondicionVenta] = useState("CONTADO");
  const [moneda, setMoneda] = useState("PYG");
  const [puntoExpedicion, setPuntoExpedicion] = useState("");
  const [productoId, setProductoId] = useState<string | null>(null);
  const [productoSelectorKey, setProductoSelectorKey] = useState(0);
  const [cantidadInputKey, setCantidadInputKey] = useState(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [items, setItems] = useState<FacturaItem[]>([]);
  const [cobroVisible, setCobroVisible] = useState(false);
  const [pagos, setPagos] = useState<PagoItem[]>([]);
  const [pagoForma, setPagoForma] = useState("EFECTIVO");
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [pagoReferencia, setPagoReferencia] = useState("");
  const cantidadInputRef = useRef<InputNumber>(null);

  const totalAbonar = useMemo(
    () => items.reduce((total, item) => total + item.exenta + item.iva5 + item.iva10, 0),
    [items]
  );

  const resumen = useMemo(() => {
    const totalExenta = items.reduce((total, item) => total + item.exenta, 0);
    const subtotalIva5 = items.reduce((total, item) => total + item.iva5, 0);
    const subtotalIva10 = items.reduce((total, item) => total + item.iva10, 0);
    const liquidacionIva5 = subtotalIva5 / 21;
    const liquidacionIva10 = subtotalIva10 / 11;

    return {
      totalExenta,
      subtotalIva5,
      subtotalIva10,
      liquidacionIva5,
      liquidacionIva10,
      totalIva: liquidacionIva5 + liquidacionIva10
    };
  }, [items]);

  const totalPagado = useMemo(
    () => pagos.reduce((total, pago) => total + pago.monto, 0),
    [pagos]
  );

  const saldoPendiente = Math.max(totalAbonar - totalPagado, 0);
  const vuelto = Math.max(totalPagado - totalAbonar, 0);
  const tableScrollHeight = `${Math.min(Math.max(items.length * 56 + 56, 180), 520)}px`;

  const cargarDatos = async () => {
    try {
      const [clientesRes, productosRes] = await Promise.all([
        PersonaService.getPaginated(0, 1000, ""),
        ProductosService.getPaginated(0, 1000, "")
      ]);

      setClientes(clientesRes?.content ?? []);
      setProductos(productosRes?.content ?? []);
    } catch (error) {
      console.error("Error cargando datos de facturación", error);
      setClientes([]);
      setProductos([]);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const clienteTemplate = (cliente: Persona) => {
    const documento = cliente.ruc
      ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
      : cliente.nroDocumento;

    return documento ? `${cliente.razonSocial} - ${documento}` : cliente.razonSocial;
  };

  const productoTemplate = (producto: Producto) => {
    if (!producto) return null;

    return (
      <div className="factura-product-option">
        <div className="font-semibold">{producto.descripcion}</div>
        <div className="text-sm text-color-secondary">
          Código: {producto.codigo}
          {producto.codigoBarra ? ` | Barra: ${producto.codigoBarra}` : ""}
          {" | "}
          Precio: {formatMoney(convertirDesdeGuaranies(producto.precioVenta ?? 0, moneda), moneda)}
        </div>
      </div>
    );
  };

  const productoValueTemplate = (producto: Producto) => {
    if (!producto) return "Seleccione producto";

    return (
      <span>
        {producto.codigo} - {producto.descripcion}
        {producto.codigoBarra ? ` | ${producto.codigoBarra}` : ""}
        {" | "}
        {formatMoney(convertirDesdeGuaranies(producto.precioVenta ?? 0, moneda), moneda)}
      </span>
    );
  };

  const cambiarMoneda = (value: string) => {
    setMoneda(value);
    setItems((prev) =>
      prev.map((item) => {
        const precioUnitarioBase =
          item.precioUnitarioBase ?? convertirAGuaranies(item.precioUnitario, moneda);

        return recalcularItem({
          ...item,
          precioUnitarioBase,
          precioUnitario: convertirDesdeGuaranies(precioUnitarioBase, value)
        });
      })
    );
    setPagos([]);
    limpiarPagoActual();
  };

  const cambiarFecha = (value: Date | Date[] | null) => {
    if (!(value instanceof Date)) return;

    const fechaNormalizada = startOfDay(value);

    if (fechaNormalizada < fechaMinima) {
      setFecha(fechaMinima);
      return;
    }

    if (fechaNormalizada > fechaMaxima) {
      setFecha(fechaMaxima);
      return;
    }

    setFecha(fechaNormalizada);
  };

  const limpiarCargaProducto = () => {
    setProductoId(null);
    setProductoSelectorKey((prev) => prev + 1);
    setCantidad(1);
    setCantidadInputKey((prev) => prev + 1);
  };

  const crearPago = (monto = 0): PagoItem => ({
    id: crypto.randomUUID(),
    formaPago: pagoForma,
    monto,
    referencia: pagoReferencia.trim()
  });

  const limpiarPagoActual = () => {
    setPagoForma("EFECTIVO");
    setPagoMonto(0);
    setPagoReferencia("");
  };

  const agregarProducto = async () => {
    const producto = productos.find((item) => item.id === productoId);

    if (!producto) {
      Swal.fire("Atención", "Seleccione un producto", "warning");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      Swal.fire("Atención", "La cantidad debe ser mayor a cero", "warning");
      return;
    }

    const itemExistente = items.find((item) => item.productoId === producto.id);

    if (itemExistente) {
      const result = await Swal.fire({
        icon: "question",
        title: "Producto que desea agregar a la factura ya existe en la lista",
        text: "¿Desea sumar la cantidad al ítem existente?",
        showCancelButton: true,
        confirmButtonText: "Sí, sumar",
        cancelButtonText: "No",
        confirmButtonColor: "#4361ee",
        cancelButtonColor: "#6b7280"
      });

      if (!result.isConfirmed) return;

      setItems((prev) => {
        const itemActualizado = recalcularItem({
          ...itemExistente,
          cantidad: itemExistente.cantidad + cantidad
        });

        return [
          itemActualizado,
          ...prev.filter((item) => item.id !== itemExistente.id)
        ];
      });

      limpiarCargaProducto();
      return;
    }

    const precioUnitarioBase = producto.precioVenta ?? 0;
    const precioUnitario = convertirDesdeGuaranies(precioUnitarioBase, moneda);
    const porcentajeIva = producto.porcentajeIva ?? 10;

    const nuevoItem = recalcularItem({
      id: crypto.randomUUID(),
      productoId: producto.id,
      codigo: producto.codigo,
      cantidad,
      descripcion: producto.descripcion,
      precioUnitario,
      precioUnitarioBase,
      porcentajeIva,
      exenta: 0,
      iva5: 0,
      iva10: 0
    });

    setItems((prev) => [nuevoItem, ...prev]);
    limpiarCargaProducto();
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const actualizarItem = (
    id: string,
    field: "cantidad" | "precioUnitario",
    value: number | null
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nextValue = value ?? 0;
        const nextItem = {
          ...item,
          [field]: field === "cantidad" ? Math.max(nextValue, 0.001) : Math.max(nextValue, 0)
        };

        return recalcularItem({
          ...nextItem,
          precioUnitarioBase:
            field === "precioUnitario"
              ? convertirAGuaranies(nextItem.precioUnitario, moneda)
              : nextItem.precioUnitarioBase
        });
      })
    );
  };

  const cantidadBody = (rowData: FacturaItem) => (
    <InputNumber
      className="factura-table-input factura-table-input-cantidad"
      inputClassName="w-full"
      value={rowData.cantidad}
      min={0.001}
      minFractionDigits={0}
      maxFractionDigits={3}
      onValueChange={(e) => actualizarItem(rowData.id, "cantidad", e.value ?? null)}
    />
  );

  const precioUnitarioBody = (rowData: FacturaItem) => (
    <InputNumber
      className="factura-table-input factura-table-input-precio"
      inputClassName="w-full"
      value={rowData.precioUnitario}
      min={0}
      locale="es-PY"
      prefix={monedaPrefix(moneda)}
      minFractionDigits={moneda === "PYG" ? 0 : 2}
      maxFractionDigits={moneda === "PYG" ? 0 : 2}
      onValueChange={(e) => actualizarItem(rowData.id, "precioUnitario", e.value ?? null)}
    />
  );

  const moneyBody = (field: keyof Pick<FacturaItem, "precioUnitario" | "exenta" | "iva5" | "iva10">) =>
    (rowData: FacturaItem) => formatMoney(rowData[field], moneda);

  const accionesBody = (rowData: FacturaItem) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      tooltip="Quitar"
      onClick={() => eliminarItem(rowData.id)}
    />
  );

  const abrirCobro = () => {
    if (!items.length) {
      Swal.fire("Atención", "Debe agregar al menos un producto para cobrar", "warning");
      return;
    }

    setPagos([]);
    limpiarPagoActual();
    setCobroVisible(true);
  };

  const agregarPago = () => {
    if (!pagoMonto || pagoMonto <= 0) {
      Swal.fire("Atención", "Ingrese un monto mayor a cero", "warning");
      return;
    }

    setPagos((prev) => [...prev, crearPago(pagoMonto)]);
    limpiarPagoActual();
  };

  const eliminarPago = (id: string) => {
    setPagos((prev) => prev.filter((pago) => pago.id !== id));
  };

  const accionesPagoBody = (rowData: PagoItem) => (
    <Button
      icon="pi pi-trash"
      severity="danger"
      text
      rounded
      tooltip="Quitar pago"
      onClick={() => eliminarPago(rowData.id)}
    />
  );

  const escapeHtml = (value: string | number | null | undefined) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formaPagoLabel = (value: string) =>
    formasPago.find((forma) => forma.value === value)?.label ?? value;

  const formaPagoTablaBody = (rowData: PagoItem) => formaPagoLabel(rowData.formaPago);
  const montoPagoTablaBody = (rowData: PagoItem) => formatMoney(rowData.monto, moneda);
  const referenciaPagoTablaBody = (rowData: PagoItem) => rowData.referencia || "-";

  const generarBoletaHtml = () => {
    const cliente = clientes.find((item) => item.id === clienteId);
    const condicion = condicionesVenta.find((item) => item.value === condicionVenta)?.label ?? condicionVenta;
    const clienteDocumento = cliente?.ruc
      ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
      : cliente?.nroDocumento ?? "-";

    const itemsRows = items
      .map((item) => {
        const subtotal = item.exenta + item.iva5 + item.iva10;

        return `
          <tr>
            <td>${escapeHtml(item.codigo)}</td>
            <td class="number">${escapeHtml(item.cantidad)}</td>
            <td>${escapeHtml(item.descripcion)}</td>
            <td class="number">${escapeHtml(formatMoney(item.precioUnitario, moneda))}</td>
            <td class="number">${escapeHtml(formatMoney(item.exenta, moneda))}</td>
            <td class="number">${escapeHtml(formatMoney(item.iva5, moneda))}</td>
            <td class="number">${escapeHtml(formatMoney(item.iva10, moneda))}</td>
            <td class="number">${escapeHtml(formatMoney(subtotal, moneda))}</td>
          </tr>
        `;
      })
      .join("");

    const pagosRows = pagos
      .map((pago) => `
        <tr>
          <td>${escapeHtml(formaPagoLabel(pago.formaPago))}</td>
          <td>${escapeHtml(pago.referencia || "-")}</td>
          <td class="number">${escapeHtml(formatMoney(pago.monto, moneda))}</td>
        </tr>
      `)
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Boleta de venta</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              color: #111827;
              font-family: Arial, sans-serif;
              font-size: 12px;
            }
            .receipt {
              max-width: 920px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 2px solid #111827;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .brand {
              font-size: 22px;
              font-weight: 700;
            }
            .doc-title {
              text-align: right;
              font-size: 18px;
              font-weight: 700;
            }
            .muted { color: #4b5563; }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 6px 24px;
              margin-bottom: 16px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              margin: 16px 0 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border-bottom: 1px solid #d1d5db;
              padding: 6px;
              vertical-align: top;
            }
            th {
              background: #f3f4f6;
              text-align: left;
              font-weight: 700;
            }
            .number {
              text-align: right;
              white-space: nowrap;
            }
            .totals {
              display: grid;
              grid-template-columns: 1fr 260px;
              gap: 24px;
              margin-top: 16px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              padding: 5px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .grand-total {
              font-size: 18px;
              font-weight: 700;
              border-bottom: 0;
              padding-top: 10px;
            }
            .footer {
              margin-top: 24px;
              text-align: center;
              color: #4b5563;
            }
            @media print {
              body { padding: 0; }
              .receipt { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div>
                <div class="brand">Ya Factura</div>
                <div class="muted">Sistema Administrativo</div>
                <div class="muted">Punto de expedición: ${escapeHtml(puntoExpedicion || "-")}</div>
              </div>
              <div>
                <div class="doc-title">BOLETA DE VENTA</div>
                <div class="muted">Fecha: ${escapeHtml(fecha.toLocaleDateString("es-PY"))}</div>
                <div class="muted">Condición: ${escapeHtml(condicion)}</div>
                <div class="muted">Moneda: ${escapeHtml(moneda)}</div>
              </div>
            </div>

            <div class="info-grid">
              <div><strong>Cliente:</strong> ${escapeHtml(cliente?.razonSocial ?? "-")}</div>
              <div><strong>Documento:</strong> ${escapeHtml(clienteDocumento)}</div>
              <div><strong>Ítems:</strong> ${escapeHtml(items.length)}</div>
              <div><strong>Total pagado:</strong> ${escapeHtml(formatMoney(totalPagado, moneda))}</div>
            </div>

            <div class="section-title">Detalle de productos</div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th class="number">Cant.</th>
                  <th>Descripción</th>
                  <th class="number">Precio</th>
                  <th class="number">Exenta</th>
                  <th class="number">IVA 5</th>
                  <th class="number">IVA 10</th>
                  <th class="number">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>

            <div class="totals">
              <div>
                <div class="section-title">Formas de pago</div>
                <table>
                  <thead>
                    <tr>
                      <th>Forma</th>
                      <th>Referencia</th>
                      <th class="number">Monto</th>
                    </tr>
                  </thead>
                  <tbody>${pagosRows}</tbody>
                </table>
              </div>

              <div>
                <div class="section-title">Totales</div>
                <div class="summary-row"><span>Exenta</span><strong>${escapeHtml(formatMoney(resumen.totalExenta, moneda))}</strong></div>
                <div class="summary-row"><span>Subtotal IVA 5</span><strong>${escapeHtml(formatMoney(resumen.subtotalIva5, moneda))}</strong></div>
                <div class="summary-row"><span>Subtotal IVA 10</span><strong>${escapeHtml(formatMoney(resumen.subtotalIva10, moneda))}</strong></div>
                <div class="summary-row"><span>IVA 5</span><strong>${escapeHtml(formatMoney(resumen.liquidacionIva5, moneda))}</strong></div>
                <div class="summary-row"><span>IVA 10</span><strong>${escapeHtml(formatMoney(resumen.liquidacionIva10, moneda))}</strong></div>
                <div class="summary-row"><span>Total IVA</span><strong>${escapeHtml(formatMoney(resumen.totalIva, moneda))}</strong></div>
                <div class="summary-row grand-total"><span>Total</span><strong>${escapeHtml(formatMoney(totalAbonar, moneda))}</strong></div>
                <div class="summary-row"><span>Vuelto</span><strong>${escapeHtml(formatMoney(vuelto, moneda))}</strong></div>
              </div>
            </div>

            <div class="footer">Gracias por su compra</div>
          </div>

          <script>
            window.addEventListener("load", () => {
              window.focus();
              window.print();
            });
          </script>
        </body>
      </html>
    `;
  };

  const abrirBoletaImprimible = () => {
    const popup = window.open("", "_blank");

    if (!popup) {
      Swal.fire("Atención", "El navegador bloqueó la pestaña de impresión", "warning");
      return false;
    }

    popup.document.open();
    popup.document.write(generarBoletaHtml());
    popup.document.close();
    return true;
  };

  const limpiarFacturacion = () => {
    setFecha(hoy);
    setClienteId(null);
    setCondicionVenta("CONTADO");
    setMoneda("PYG");
    setPuntoExpedicion("");
    limpiarCargaProducto();
    setItems([]);
    setPagos([]);
    limpiarPagoActual();
  };

  const obtenerMonedaId = (codigo: string) => {
  if (codigo === "PYG") return 1;
  if (codigo === "USD") return 2;
  if (codigo === "BRL") return 3;
  if (codigo === "EUR") return 4;
  return 1;
};

const obtenerCondicionOperacionId = (condicion: string) => {
  return condicion === "CONTADO" ? 1 : 2;
};

const obtenerTipoPagoId = (formaPago: string) => {
  if (formaPago === "EFECTIVO") return 1;
  if (formaPago === "CHEQUE") return 2;
  if (formaPago === "TARJETA") return 3;
  if (formaPago === "TRANSFERENCIA") return 4;
  if (formaPago === "QR") return 5;
  if (formaPago === "BILLETERA") return 6;
  return 99;
};

const crearFacturaPayload = () => {
  const empresaId = localStorage.getItem("empresaId");

  const dBaseGrav5 = resumen.subtotalIva5 > 0 ? resumen.subtotalIva5 / 1.05 : 0;
  const dBaseGrav10 = resumen.subtotalIva10 > 0 ? resumen.subtotalIva10 / 1.1 : 0;

  return {
    empresaId,
    clienteId,

    nroCaja: 1,

    tipoTransaccionId: 1,
    tipoImpuestoId: 1,
    monedaId: obtenerMonedaId(moneda),
    indicadorPresencia: 1,
    condicionOperacionId: obtenerCondicionOperacionId(condicionVenta),
    tipoOperacionId: 1,

    dInfoEmi: null,
    dInfoFisc: null,
    dEst: puntoExpedicion.split("-")[0] || "001",
    dPunExp: puntoExpedicion.split("-")[1] || "001",
    dNumDoc: "0000001",
    dSerieNum: null,
    dFeEmiDE: fecha.toISOString(),

    dCondTiCam: moneda === "PYG" ? "1" : "2",
    dTiCam: cotizaciones[moneda] ?? 1,

    dInfAdic: null,
    iCondCred: condicionVenta === "CREDITO" ? 1 : null,
    dPlazoCre: null,
    dCuotas: null,
    dMonEnt: null,

    saldo: saldoPendiente,
    vendedorId: null,
    dOrdCompra: null,

    subtotal: {
      dSubExe: resumen.totalExenta,
      dSubExo: 0,
      dSub5: resumen.subtotalIva5,
      dSub10: resumen.subtotalIva10,

      dTotOpe: totalAbonar,
      dTotDesc: 0,
      dTotDescGlotem: 0,
      dDescTotal: 0,

      dTotGralOpe: totalAbonar,

      dIVA5: resumen.liquidacionIva5,
      dIVA10: resumen.liquidacionIva10,
      dTotIVA: resumen.totalIva,

      dBaseGrav5,
      dBaseGrav10,
      dTBasGraIVA: dBaseGrav5 + dBaseGrav10,

      dTotalGs: convertirAGuaranies(totalAbonar, moneda)
    },

    detalles: items.map((item) => {
      const totalItem = item.exenta + item.iva5 + item.iva10;
      const brutoItem = item.cantidad * item.precioUnitario;

      const baseGravada =
        item.porcentajeIva === 10
          ? item.iva10 / 1.1
          : item.porcentajeIva === 5
            ? item.iva5 / 1.05
            : 0;

      const liquidacionIva =
        item.porcentajeIva === 10
          ? item.iva10 / 11
          : item.porcentajeIva === 5
            ? item.iva5 / 21
            : 0;

      return {
        productoId: item.productoId,

        dDesProSer: item.descripcion,
        cUniMed: "77",
        dCantProSer: item.cantidad,

        dPUniProSer: item.precioUnitario,
        dTotBruOpeItem: brutoItem,
        dTotOpeItem: totalItem,
        dTotOpeGs: convertirAGuaranies(totalItem, moneda),

        iAfecIVA: item.porcentajeIva === 0 ? "3" : "1",
        dPropIVA: item.porcentajeIva === 0 ? 0 : 100,
        dTasaIVA: item.porcentajeIva,
        dBasGravIVA: baseGravada,
        dLiqIVAItem: liquidacionIva,
        dBasExe: item.exenta,

        dDescItem: 0,
        dPorcDesIt: 0,
        dDescGloItem: 0,

        codigoBodega: 1,
        dncm: null,
        dNCM: null
      };
    }),

    pagos: pagos.map((pago) => ({
      formaPago: pago.formaPago,
      monto: pago.monto,
      referencia: pago.referencia,

      idTipo: obtenerTipoPagoId(pago.formaPago),
      codigoBanco: null,
      codigoTipoCheque: null,
      vencimientoCheque: null,
      codTipoTarjeta: null,

      codigoMoneda: moneda,
      codigoCotizacion: cotizaciones[moneda] ?? 1
    }))
  };
};

const confirmarCobro = async () => {
  if (!pagos.length || totalPagado <= 0) {
    Swal.fire("Atención", "Debe ingresar al menos una forma de pago", "warning");
    return;
  }

  if (saldoPendiente > 0) {
    Swal.fire("Atención", "El monto pagado no cubre el total de la venta", "warning");
    return;
  }

  try {
    const payload = crearFacturaPayload();

    console.log("PAYLOAD FACTURA", payload);

    await FacturaService.create(payload);

    const boletaAbierta = abrirBoletaImprimible();

    if (!boletaAbierta) return;

    Swal.fire("Cobro registrado", "La venta quedó registrada correctamente", "success");
    setCobroVisible(false);
    limpiarFacturacion();
  } catch (error) {
    console.error("Error registrando factura", error);
    Swal.fire("Error", "No se pudo registrar la factura", "error");
  }
};

  const cobroFooter = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        severity="secondary"
        outlined
        onClick={() => setCobroVisible(false)}
      />
      <Button
        label="Confirmar cobro"
        icon="pi pi-check"
        disabled={saldoPendiente > 0}
        onClick={confirmarCobro}
      />
    </div>
  );

  return (
    <div>
      <style>
        {`
          .facturacion-table .p-datatable-tbody > tr > td {
            padding-top: .42rem;
            padding-bottom: .42rem;
          }

          .factura-table-input .p-inputtext {
            height: 2rem;
            padding: .25rem .5rem;
            font-size: .9rem;
          }

          .factura-table-input-cantidad {
            width: 76px;
          }

          .factura-table-input-precio {
            width: 132px;
          }

          .facturacion-summary {
            display: grid;
            gap: .65rem;
          }

          .facturacion-detail-layout {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 280px;
            gap: 1rem;
            align-items: start;
          }

          .facturacion-table-wrap {
            min-width: 0;
          }

          .facturacion-table .p-datatable-wrapper {
            overflow: auto;
          }

          .facturacion-summary-panel {
            position: sticky;
            top: 1rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: .85rem;
            background: #ffffff;
          }

          .facturacion-summary-total {
            border-top: 1px solid #e5e7eb;
            margin-top: .75rem;
            padding-top: .75rem;
          }

          .factura-product-option {
            line-height: 1.25;
          }

          .factura-product-dropdown .p-dropdown-items-wrapper {
            max-height: 420px !important;
          }

          .facturacion-cobro-totales {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: .75rem;
          }

          .facturacion-pago-form {
            display: grid;
            grid-template-columns: 180px 190px minmax(180px, 1fr) 150px;
            gap: .75rem;
            align-items: end;
            padding: .85rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #f8fafc;
          }

          @media (max-width: 760px) {
            .facturacion-cobro-totales {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .facturacion-pago-form {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 1100px) {
            .facturacion-detail-layout {
              grid-template-columns: 1fr;
            }

            .facturacion-summary-panel {
              position: static;
            }
          }
        `}
      </style>

      <div className="flex flex-column gap-1 mb-4">
        <h2 className="m-0">Facturación</h2>
        <small className="text-color-secondary">Carga de comprobante de venta</small>
      </div>

      <div className="grid">
        <div className="col-12 md:col-4">
          <label>Cliente</label>
          <Dropdown
            className="w-full"
            value={clienteId}
            options={clientes}
            optionLabel="razonSocial"
            optionValue="id"
            itemTemplate={clienteTemplate}
            valueTemplate={(cliente) => (cliente ? clienteTemplate(cliente) : "Seleccione cliente")}
            placeholder="Seleccione cliente"
            filter
            showClear
            onChange={(e) => setClienteId(e.value)}
          />
        </div>

        <div className="col-12 md:col-2">
          <label>Fecha</label>
          <Calendar
            className="w-full"
            inputClassName="w-full"
            value={fecha}
            minDate={fechaMinima}
            maxDate={fechaMaxima}
            dateFormat="dd/mm/yy"
            showIcon
            onChange={(e) => cambiarFecha(e.value ?? null)}
          />
        </div>

        <div className="col-12 md:col-2">
          <label>Condición</label>
          <Dropdown
            className="w-full"
            value={condicionVenta}
            options={condicionesVenta}
            onChange={(e) => setCondicionVenta(e.value)}
          />
        </div>

        <div className="col-12 md:col-2">
          <label>Moneda</label>
          <Dropdown
            className="w-full"
            value={moneda}
            options={monedas}
            onChange={(e) => cambiarMoneda(e.value)}
          />
        </div>

        <div className="col-12 md:col-2">
          <label>Punto de expedición</label>
          <InputText
            className="w-full"
            value={puntoExpedicion}
            placeholder="Ej: 001-001"
            onChange={(e) => setPuntoExpedicion(e.target.value)}
          />
        </div>
      </div>

      <div className="grid align-items-end mt-2">
        <div className="col-12 md:col-7">
          <label>Producto</label>
          <Dropdown
            key={productoSelectorKey}
            className="w-full"
            value={productoId}
            options={productos}
            optionLabel="descripcion"
            optionValue="id"
            itemTemplate={productoTemplate}
            valueTemplate={productoValueTemplate}
            placeholder="Seleccione producto"
            panelClassName="factura-product-dropdown"
            scrollHeight="420px"
            filter
            filterBy="descripcion,codigo,codigoBarra"
            filterInputAutoFocus
            showClear
            resetFilterOnHide
            onChange={(e) => {
              setProductoId(e.value);
              window.setTimeout(() => cantidadInputRef.current?.focus(), 0);
            }}
          />
        </div>

        <div className="col-12 md:col-2">
          <label>Cantidad</label>
          <InputNumber
            key={cantidadInputKey}
            ref={cantidadInputRef}
            className="w-full"
            inputClassName="w-full"
            value={cantidad}
            min={1}
            minFractionDigits={0}
            maxFractionDigits={3}
            onValueChange={(e) => setCantidad(e.value ?? 1)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarProducto();
              }
            }}
          />
        </div>

        <div className="col-12 md:col-3">
          <Button
            className="w-full"
            icon="pi pi-plus"
            label="Agregar"
            onClick={agregarProducto}
          />
        </div>
      </div>

      <div className="facturacion-detail-layout mt-4">
        <div className="facturacion-table-wrap">
          <DataTable
            value={items}
            className="facturacion-table"
            size="small"
            stripedRows
            scrollable
            scrollHeight={tableScrollHeight}
            emptyMessage="No hay productos cargados"
          >
            <Column field="codigo" header="Código" />
            <Column header="Cantidad" body={cantidadBody} style={{ width: "96px" }} />
            <Column field="descripcion" header="Descripción producto" />
            <Column header="Precio unitario" body={precioUnitarioBody} style={{ width: "152px" }} />
            <Column header="Exenta" body={moneyBody("exenta")} />
            <Column header="IVA 5" body={moneyBody("iva5")} />
            <Column header="IVA 10" body={moneyBody("iva10")} />
            <Column body={accionesBody} style={{ width: "70px" }} />
          </DataTable>
        </div>

        <aside className="facturacion-summary-panel">
          <div className="text-lg font-semibold mb-3">Resumen</div>

          <div className="facturacion-summary">
            <ResumenMonto label="Exenta" value={formatMoney(resumen.totalExenta, moneda)} />
            <ResumenMonto label="Subtotal IVA 5" value={formatMoney(resumen.subtotalIva5, moneda)} />
            <ResumenMonto label="Subtotal IVA 10" value={formatMoney(resumen.subtotalIva10, moneda)} />
            <ResumenMonto label="IVA 5" value={formatMoney(resumen.liquidacionIva5, moneda)} />
            <ResumenMonto label="IVA 10" value={formatMoney(resumen.liquidacionIva10, moneda)} />
            <ResumenMonto label="Total IVA" value={formatMoney(resumen.totalIva, moneda)} />
          </div>

          <div className="facturacion-summary-total">
            <ResumenMonto label="Ítems registrados" value={items.length.toString()} destacado />
            <ResumenMonto label="Total a abonar" value={formatMoney(totalAbonar, moneda)} destacado />
          </div>

          <Button
            className="w-full mt-3"
            icon="pi pi-credit-card"
            label="Cobrar"
            severity="success"
            disabled={!items.length}
            onClick={abrirCobro}
          />
        </aside>
      </div>

      <Dialog
        header="Cobro de venta"
        visible={cobroVisible}
        modal
        style={{ width: "860px", maxWidth: "95vw" }}
        footer={cobroFooter}
        onHide={() => setCobroVisible(false)}
      >
        <div className="facturacion-cobro-totales mb-4">
          <ResumenMonto label="Total venta" value={formatMoney(totalAbonar, moneda)} destacado />
          <ResumenMonto label="Total pagado" value={formatMoney(totalPagado, moneda)} />
          <ResumenMonto label="Saldo pendiente" value={formatMoney(saldoPendiente, moneda)} />
          <ResumenMonto label="Vuelto" value={formatMoney(vuelto, moneda)} />
        </div>

        <div className="font-semibold mb-2">Cargar forma de pago</div>

        <div className="facturacion-pago-form mb-4">
          <div>
            <label>Forma de pago</label>
            <Dropdown
              className="w-full"
              value={pagoForma}
              options={formasPago}
              onChange={(e) => setPagoForma(e.value)}
            />
          </div>

          <div>
            <label>Monto</label>
            <InputNumber
              className="w-full"
              inputClassName="w-full"
              value={pagoMonto}
              min={0}
              locale="es-PY"
              prefix={monedaPrefix(moneda)}
              minFractionDigits={moneda === "PYG" ? 0 : 2}
              maxFractionDigits={moneda === "PYG" ? 0 : 2}
              onValueChange={(e) => setPagoMonto(Math.max(Number(e.value ?? 0), 0))}
            />
          </div>

          <div>
            <label>Referencia</label>
            <InputText
              className="w-full"
              value={pagoReferencia}
              placeholder="Nro. operación, cheque..."
              onChange={(e) => setPagoReferencia(e.target.value)}
            />
          </div>

          <Button
            icon="pi pi-plus"
            label="Agregar"
            onClick={agregarPago}
          />
        </div>

        <div className="font-semibold mb-2">Pagos agregados</div>

        <DataTable
          value={pagos}
          size="small"
          emptyMessage="No hay formas de pago cargadas"
        >
          <Column header="Forma de pago" body={formaPagoTablaBody} style={{ minWidth: "180px" }} />
          <Column header="Monto" body={montoPagoTablaBody} style={{ minWidth: "160px" }} />
          <Column header="Referencia" body={referenciaPagoTablaBody} />
          <Column body={accionesPagoBody} style={{ width: "70px" }} />
        </DataTable>
      </Dialog>
    </div>
  );
}

function ResumenMonto({
  label,
  value,
  destacado = false
}: {
  label: string;
  value: string;
  destacado?: boolean;
}) {
  return (
    <div
      className="px-2 py-2"
      style={{
        background: destacado ? "#f8fafc" : "#ffffff",
        borderRadius: 4
      }}
    >
      <div className="text-color-secondary text-sm">{label}</div>
      <div className={destacado ? "text-2xl font-bold" : "text-lg font-semibold"}>
        {value}
      </div>
    </div>
  );
}
