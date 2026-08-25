import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { CanalVentaService, type CanalVenta } from "../../services/CanalVentaService";
import { VendedorService, type Vendedor } from "../../services/VendedorService";
import { CajaAperturaCierreService } from "../../services/CajaAperturaCierreService";
import { CondicionVentaService, type CondicionVenta } from "../../services/CondicionVentaService";
import { descargarBoletaVentaPdf } from "../../comprobantes/invoices";

interface Persona {
  id: string;
  razonSocial: string;
  ruc?: string;
  dv?: string;
  nroDocumento?: string;
  direccion?: string;
}

interface ProductoStockDeposito {
  depositoNombre: string;
  stock: number;
}

interface Producto {
  id: string;
  codigo: string;
  codigoBarra?: string;
  descripcion: string;
  precioVenta: number | null;
  porcentajeIva: number | null;
  stockTotal?: number;
  stockPorDeposito?: ProductoStockDeposito[];
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

const monedas = [
  { label: "Guaraníes", value: "PYG" },
  { label: "Dólares", value: "USD" },
  { label: "Reales", value: "BRL" },
  { label: "Euros", value: "EUR" }
];

const puntosExpedicion = [
  { label: "001-001", value: "001-001" },
  { label: "001-002", value: "001-002" },
  { label: "002-001", value: "002-001" }
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
  const navigate = useNavigate();
  const hoy = useMemo(() => startOfDay(new Date()), []);
  const fechaMinima = useMemo(() => addDays(hoy, -29), [hoy]);
  const fechaMaxima = useMemo(() => addDays(hoy, 5), [hoy]);

  const [clientes, setClientes] = useState<Persona[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [canalesVenta, setCanalesVenta] = useState<CanalVenta[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [condiciones, setCondiciones] = useState<CondicionVenta[]>([]);
  const [fecha, setFecha] = useState<Date>(hoy);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [canalVentaId, setCanalVentaId] = useState<string | null>(null);
  const [vendedorSeleccionadoId, setVendedorSeleccionadoId] = useState<string | null>(null);
  const [condicionVentaId, setCondicionVentaId] = useState<string | null>(null);
  const [moneda, setMoneda] = useState("PYG");
  const [puntoExpedicion, setPuntoExpedicion] = useState("");
  const [descuento, setDescuento] = useState<number>(0);
  const [anticipo, setAnticipo] = useState<number>(0);
  const [productoId, setProductoId] = useState<string | null>(null);
  const [productoSelectorKey, setProductoSelectorKey] = useState(0);
  const [cantidadInputKey, setCantidadInputKey] = useState(0);
  const [cantidad, setCantidad] = useState<number | null>(1);
  const [items, setItems] = useState<FacturaItem[]>([]);
  const [cobroVisible, setCobroVisible] = useState(false);
  const [pagos, setPagos] = useState<PagoItem[]>([]);
  const [pagoForma, setPagoForma] = useState("EFECTIVO");
  const [pagoMonto, setPagoMonto] = useState<number>(0);
  const [pagoReferencia, setPagoReferencia] = useState("");
  const cantidadInputRef = useRef<InputNumber>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalAbonar = useMemo(
    () => items.reduce((total, item) => total + item.exenta + item.iva5 + item.iva10, 0),
    [items]
  );

  const totalDescuento = Math.max(descuento, 0);
  const totalAnticipo = Math.max(anticipo, 0);
  const totalNeto = Math.max(totalAbonar - totalDescuento - totalAnticipo, 0);

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

  const saldoPendiente = Math.max(totalNeto - totalPagado, 0);
  const vuelto = Math.max(totalPagado - totalNeto, 0);
  const tableScrollHeight = `${Math.min(Math.max(items.length * 56 + 56, 180), 520)}px`;

  const condicionSeleccionada = useMemo(
    () => condiciones.find((c) => c.id === condicionVentaId) ?? null,
    [condiciones, condicionVentaId]
  );

  const esContado = (condicionSeleccionada?.tipoOperacion ?? 1) === 1;

  const cargarDatos = async () => {
    try {
      const [clientesRes, productosRes, canalesRes, vendedoresRes, condicionesRes] = await Promise.all([
        PersonaService.getPaginated(0, 1000, ""),
        ProductosService.getPaginated(0, 1000, ""),
        CanalVentaService.getAll(),
        VendedorService.getAll(),
        CondicionVentaService.getActivas()
      ]);

      setClientes(clientesRes?.content ?? []);
      setProductos(productosRes?.content ?? []);
      setCanalesVenta(canalesRes ?? []);
      setVendedores(vendedoresRes ?? []);
      setCondiciones(condicionesRes ?? []);

      const predeterminada = (condicionesRes ?? []).find((c) => c.predeterminada) ?? (condicionesRes ?? [])[0];
      if (predeterminada) {
        setCondicionVentaId(predeterminada.id);
      }
    } catch (error) {
      console.error("Error cargando datos de facturación", error);
      setClientes([]);
      setProductos([]);
      setCanalesVenta([]);
      setVendedores([]);
      setCondiciones([]);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    CajaAperturaCierreService.getCajaAbierta(1).catch(() => {
      Swal.fire({
        icon: "warning",
        title: "Sin apertura de caja",
        text: "No hay una apertura de caja activa para el día de hoy. Realice la apertura de caja antes de emitir facturas.",
        confirmButtonText: "Ir a apertura de caja",
        showCancelButton: true,
        cancelButtonText: "Volver al listado"
      }).then((result) => {
        navigate(result.isConfirmed ? "/apertura-caja" : "/facturacion");
      });
    });
  }, [navigate]);

  const clienteTemplate = (cliente: Persona) => {
    if (!cliente) return null;

    const documento = cliente.ruc
      ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
      : cliente.nroDocumento;

    return (
      <div>
        <div className="font-semibold">{cliente.razonSocial}</div>
        {documento && (
          <div className="text-sm text-color-secondary">RUC/Doc: {documento}</div>
        )}
      </div>
    );
  };

  const clienteValueTemplate = (cliente: Persona) => {
    if (!cliente) return "Seleccione cliente";

    const documento = cliente.ruc
      ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
      : cliente.nroDocumento;

    return (
      <span>
        {cliente.razonSocial}
        {documento ? ` - ${documento}` : ""}
      </span>
    );
  };

  const formatStock = (stockTotal?: number) => {
    const stock = stockTotal ?? 0;
    return new Intl.NumberFormat("es-PY", { maximumFractionDigits: 4 }).format(stock);
  };

  const productoTemplate = (producto: Producto) => {
    if (!producto) return null;

    const sinStock = (producto.stockTotal ?? 0) <= 0;
    const stockPorDeposito = producto.stockPorDeposito ?? [];

    return (
      <div className="factura-product-option">
        <div className="font-semibold">{producto.descripcion}</div>
        <div className="text-sm text-color-secondary">
          Código: {producto.codigo}
          {producto.codigoBarra ? ` | Barra: ${producto.codigoBarra}` : ""}
          {" | "}
          Precio: {formatMoney(convertirDesdeGuaranies(producto.precioVenta ?? 0, moneda), moneda)}
        </div>
        <div className="text-sm mt-1">
          {stockPorDeposito.length === 0 ? (
            <span className="text-red-500 font-semibold">Sin stock</span>
          ) : (
            stockPorDeposito.map((item, index) => (
              <span
                key={item.depositoNombre}
                className={item.stock <= 0 ? "text-red-500 font-semibold" : "text-green-600"}
              >
                {item.depositoNombre}: {formatStock(item.stock)}
                {index < stockPorDeposito.length - 1 ? " · " : ""}
              </span>
            ))
          )}
          <span className={sinStock ? "text-red-500 font-semibold" : "text-color-secondary"}>
            {" "}(Total: {formatStock(producto.stockTotal)})
          </span>
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
        {" | "}
        Stock: {formatStock(producto.stockTotal)}
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
          cantidad: itemExistente.cantidad + (cantidad ?? 1)
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

  const formaPagoLabel = (value: string) =>
    formasPago.find((forma) => forma.value === value)?.label ?? value;

  const formaPagoTablaBody = (rowData: PagoItem) => formaPagoLabel(rowData.formaPago);
  const montoPagoTablaBody = (rowData: PagoItem) => formatMoney(rowData.monto, moneda);
  const referenciaPagoTablaBody = (rowData: PagoItem) => rowData.referencia || "-";
  const vueltoTablaBody = (rowData: PagoItem, options: { rowIndex: number }) => {
    const esUltimo = options.rowIndex === pagos.length - 1;
    if (esUltimo && vuelto > 0 && rowData.formaPago === "EFECTIVO") {
      return <span className="text-orange-500 font-semibold">{formatMoney(vuelto, moneda)}</span>;
    }
    return <span className="text-color-secondary">-</span>;
  };

  const abrirBoletaImprimible = async (dNumDocReal?: string, facturaRes?: any) => {
    const cliente = clientes.find((item) => item.id === clienteId);
    const condicionLabel = condicionSeleccionada?.descripcion ?? "";

    const clienteRazonSocial = facturaRes?.dNomRec ?? cliente?.razonSocial ?? "-";
    const clienteDireccion   = facturaRes?.dDirRec ?? cliente?.direccion ?? "";
    const clienteDocumento   = facturaRes?.dRucRec
      ? `${facturaRes.dRucRec}${facturaRes.dDVRec ? "-" + facturaRes.dDVRec : ""}`
      : (cliente?.ruc
          ? `${cliente.ruc}${cliente.dv ? "-" + cliente.dv : ""}`
          : (cliente?.nroDocumento || "-"));

    const parts = (puntoExpedicion || "").split("-");
    const est  = /^\d+$/.test(parts[0] ?? "") ? parts[0] : "001";
    const pexp = /^\d+$/.test(parts[1] ?? "") ? parts[1] : "001";
    const puntoDisplay = `${est}-${pexp}`;
    const nroDoc = `${puntoDisplay}-${(dNumDocReal ?? "0000001").padStart(7, "0")}`;

    await descargarBoletaVentaPdf({
      puntoExpedicion: puntoDisplay,
      nroDoc,
      fecha,
      moneda,
      condicionVenta: condicionSeleccionada?.tipoOperacion ?? 1,
      condicionLabel,
      clienteRazonSocial,
      clienteDocumento,
      clienteDireccion,
      items: items.map((item) => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        exenta: item.exenta,
        iva5: item.iva5,
        iva10: item.iva10,
      })),
      pagos: pagos.map((pago) => ({
        formaPago: pago.formaPago,
        referencia: pago.referencia || "",
        monto: pago.monto,
      })),
      resumen: {
        totalExenta: resumen.totalExenta,
        subtotalIva5: resumen.subtotalIva5,
        subtotalIva10: resumen.subtotalIva10,
        liquidacionIva5: resumen.liquidacionIva5,
        liquidacionIva10: resumen.liquidacionIva10,
        totalIva: resumen.totalIva,
      },
      totalAbonar,
      vuelto,
      cdc: facturaRes?.cdc ?? undefined,
    });
  };

  const limpiarFacturacion = () => {
    setFecha(hoy);
    setClienteId(null);
    setCanalVentaId(null);
    setVendedorSeleccionadoId(null);
    setCondicionVentaId(condiciones.find((c) => c.predeterminada)?.id ?? condiciones[0]?.id ?? null);
    setMoneda("PYG");
    setPuntoExpedicion("");
    setDescuento(0);
    setAnticipo(0);
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
    condicionOperacionId: condicionSeleccionada?.tipoOperacion ?? 1,
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
    iCondCred: condicionSeleccionada?.tipoCondicionCredito ?? null,
    dPlazoCre: condicionSeleccionada?.intervaloDias != null ? String(condicionSeleccionada.intervaloDias) : null,
    dCuotas: condicionSeleccionada?.cantidadCuotas ?? null,
    dMonEnt: condicionSeleccionada?.montoCuotaInicial ?? null,

    saldo: saldoPendiente,
    vendedorId: null,
    vendedorSeleccionadoId,
    canalVentaId,
    dOrdCompra: null,

    subtotal: {
      dSubExe: resumen.totalExenta,
      dSubExo: 0,
      dSub5: resumen.subtotalIva5,
      dSub10: resumen.subtotalIva10,

      dTotOpe: totalAbonar,
      dTotDesc: totalDescuento,
      dTotDescGlotem: 0,
      dDescTotal: totalDescuento,

      dTotGralOpe: totalNeto,

      dIVA5: resumen.liquidacionIva5,
      dIVA10: resumen.liquidacionIva10,
      dTotIVA: resumen.totalIva,

      dBaseGrav5,
      dBaseGrav10,
      dTBasGraIVA: dBaseGrav5 + dBaseGrav10,

      dAnticipo: totalAnticipo,
      dTotalGs: convertirAGuaranies(totalNeto, moneda)
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

    pagos: pagos.map((pago, index) => {
      const esUltimoPago = index === pagos.length - 1;
      const pagoVuelto =
        esUltimoPago && vuelto > 0 && pago.formaPago === "EFECTIVO"
          ? vuelto
          : 0;

      return {
        formaPago: pago.formaPago,
        monto: pago.monto,
        vuelto: pagoVuelto,
        referencia: pago.referencia,

        idTipo: obtenerTipoPagoId(pago.formaPago),
        codigoBanco: null,
        codigoTipoCheque: null,
        vencimientoCheque: null,
        codTipoTarjeta: null,

        codigoMoneda: moneda,
        codigoCotizacion: cotizaciones[moneda] ?? 1
      };
    })
  };
};

const confirmarCobro = async () => {
  if (totalNeto > 0 && (!pagos.length || totalPagado <= 0)) {
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

    const facturaCreada = await FacturaService.create(payload);

    await abrirBoletaImprimible(facturaCreada?.dNumDoc ?? facturaCreada?.dnumDoc, facturaCreada);

    await Swal.fire("Cobro registrado", "La venta quedó registrada correctamente", "success");
    setCobroVisible(false);
    limpiarFacturacion();
    navigate("/facturacion");
  } catch (error) {
    console.error("Error registrando factura", error);
    Swal.fire("Error", "No se pudo registrar la factura", "error");
  }
};

const facturarACredito = async () => {
  try {
    const payload = crearFacturaPayload();

    const facturaCreada = await FacturaService.create(payload);

    await abrirBoletaImprimible(facturaCreada?.dNumDoc ?? facturaCreada?.dnumDoc, facturaCreada);

    await Swal.fire("Factura registrada", "La venta a crédito quedó registrada correctamente", "success");
    limpiarFacturacion();
    navigate("/facturacion");
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
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

          .facturacion-summary-total > * + * {
            border-top: 1px dashed #e5e7eb;
          }

          .facturacion-summary-total > *:last-child {
            border-top: 1px solid #d1d5db;
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

          .facturacion-cobro-totales .text-2xl {
            font-size: 1.15rem;
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

          /* Tablet portrait — collapsar detail layout */
          @media (max-width: 1024px) {
            .facturacion-detail-layout {
              grid-template-columns: 1fr;
            }

            .facturacion-summary-panel {
              position: static;
            }

            .facturacion-summary {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          /* Mobile landscape / small tablet */
          @media (max-width: 768px) {
            .facturacion-cobro-totales {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .facturacion-pago-form {
              grid-template-columns: 1fr 1fr;
            }

            .facturacion-pago-form > *:last-child {
              grid-column: 1 / -1;
            }

            .facturacion-summary {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          /* Mobile */
          @media (max-width: 480px) {
            .facturacion-cobro-totales {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .facturacion-pago-form {
              grid-template-columns: 1fr;
            }

            .facturacion-summary {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          /* Item cards (mobile) */
          .factura-item-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .factura-item-card + .factura-item-card {
            margin-top: 8px;
          }

          .factura-item-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
          }

          .factura-item-card-title {
            font-weight: 600;
            font-size: 14px;
            line-height: 1.3;
          }

          .factura-item-card-code {
            font-size: 12px;
            color: #6b7280;
            margin-top: 2px;
          }

          .factura-item-card-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .factura-item-card-inputs label {
            display: block;
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 3px;
          }

          .factura-item-card-totals {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px;
          }

          .factura-item-card-total-cell {
            text-align: center;
          }

          .factura-item-card-total-cell .cell-label {
            font-size: 10px;
            color: #9ca3af;
          }

          .factura-item-card-total-cell .cell-value {
            font-size: 12px;
            font-weight: 600;
            color: #111827;
          }

          .factura-items-empty {
            text-align: center;
            padding: 32px 16px;
            color: #9ca3af;
            font-size: 13px;
            border: 1px dashed #d1d5db;
            border-radius: 8px;
          }
        `}
      </style>

      <div className="flex flex-column gap-1 mb-4">
        <h2 className="m-0">Facturación</h2>
        <small className="text-color-secondary">Carga de comprobante de venta</small>
      </div>

      <div className="grid">
        <div className="col-12 sm:col-12 md:col-4">
          <label>Cliente</label>
          <Dropdown
            className="w-full"
            value={clienteId}
            options={clientes}
            optionLabel="razonSocial"
            optionValue="id"
            itemTemplate={clienteTemplate}
            valueTemplate={clienteValueTemplate}
            placeholder="Seleccione cliente"
            filter
            showClear
            onChange={(e) => setClienteId(e.value)}
          />
        </div>

        <div className="col-6 sm:col-6 md:col-2">
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

        <div className="col-6 sm:col-6 md:col-2">
          <label>Condición</label>
          <Dropdown
            className="w-full"
            value={condicionVentaId}
            options={condiciones}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione condición"
            emptyMessage="No hay condiciones cargadas"
            onChange={(e) => setCondicionVentaId(e.value)}
          />
        </div>

        <div className="col-6 sm:col-6 md:col-2">
          <label>Moneda</label>
          <Dropdown
            className="w-full"
            value={moneda}
            options={monedas}
            onChange={(e) => cambiarMoneda(e.value)}
          />
        </div>

        <div className="col-6 sm:col-6 md:col-2">
          <label>Punto de expedición</label>
          <Dropdown
            className="w-full"
            value={puntoExpedicion}
            options={puntosExpedicion}
            placeholder="Seleccione punto"
            onChange={(e) => setPuntoExpedicion(e.value)}
          />
        </div>

        <div className="col-6 sm:col-6 md:col-3">
          <label>Canal de venta</label>
          <Dropdown
            className="w-full"
            value={canalVentaId}
            options={canalesVenta}
            optionLabel="descripcion"
            optionValue="id"
            placeholder="Seleccione canal"
            filter
            showClear
            emptyMessage="No hay canales cargados"
            onChange={(e) => setCanalVentaId(e.value)}
          />
        </div>

        <div className="col-6 sm:col-6 md:col-3">
          <label>Vendedor</label>
          <Dropdown
            className="w-full"
            value={vendedorSeleccionadoId}
            options={vendedores}
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccione vendedor"
            filter
            showClear
            emptyMessage="No hay vendedores cargados"
            onChange={(e) => setVendedorSeleccionadoId(e.value)}
          />
        </div>

      </div>

      <div className="grid align-items-end mt-2">
        <div className="col-12 sm:col-12 md:col-7">
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

        <div className="col-5 sm:col-4 md:col-2">
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
            onValueChange={(e) => setCantidad(e.value ?? null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarProducto();
              }
            }}
          />
        </div>

        <div className="col-7 sm:col-8 md:col-3">
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
          {isMobile ? (
            items.length === 0 ? (
              <div className="factura-items-empty">No hay productos cargados</div>
            ) : (
              <div>
                {items.map((item) => (
                  <div key={item.id} className="factura-item-card">
                    <div className="factura-item-card-header">
                      <div>
                        <div className="factura-item-card-title">{item.descripcion}</div>
                        <div className="factura-item-card-code">Código: {item.codigo}</div>
                      </div>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        onClick={() => eliminarItem(item.id)}
                      />
                    </div>

                    <div className="factura-item-card-inputs">
                      <div>
                        <label>Cantidad</label>
                        <InputNumber
                          className="factura-table-input w-full"
                          inputClassName="w-full"
                          value={item.cantidad}
                          min={0.001}
                          minFractionDigits={0}
                          maxFractionDigits={3}
                          onValueChange={(e) => actualizarItem(item.id, "cantidad", e.value ?? null)}
                        />
                      </div>
                      <div>
                        <label>Precio unitario</label>
                        <InputNumber
                          className="factura-table-input w-full"
                          inputClassName="w-full"
                          value={item.precioUnitario}
                          min={0}
                          locale="es-PY"
                          prefix={monedaPrefix(moneda)}
                          minFractionDigits={moneda === "PYG" ? 0 : 2}
                          maxFractionDigits={moneda === "PYG" ? 0 : 2}
                          onValueChange={(e) => actualizarItem(item.id, "precioUnitario", e.value ?? null)}
                        />
                      </div>
                    </div>

                    <div className="factura-item-card-totals">
                      <div className="factura-item-card-total-cell">
                        <div className="cell-label">Exenta</div>
                        <div className="cell-value">{formatMoney(item.exenta, moneda)}</div>
                      </div>
                      <div className="factura-item-card-total-cell">
                        <div className="cell-label">IVA 5</div>
                        <div className="cell-value">{formatMoney(item.iva5, moneda)}</div>
                      </div>
                      <div className="factura-item-card-total-cell">
                        <div className="cell-label">IVA 10</div>
                        <div className="cell-value">{formatMoney(item.iva10, moneda)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
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
          )}
        </div>

        <aside className="facturacion-summary-panel">
          <div className="text-lg font-semibold mb-3">Resumen</div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label>Descuento</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={descuento}
                min={0}
                locale="es-PY"
                prefix={monedaPrefix(moneda)}
                minFractionDigits={moneda === "PYG" ? 0 : 2}
                maxFractionDigits={moneda === "PYG" ? 0 : 2}
                onValueChange={(e) => setDescuento(Math.max(Number(e.value ?? 0), 0))}
              />
            </div>
            <div>
              <label>Anticipo</label>
              <InputNumber
                className="w-full"
                inputClassName="w-full"
                value={anticipo}
                min={0}
                locale="es-PY"
                prefix={monedaPrefix(moneda)}
                minFractionDigits={moneda === "PYG" ? 0 : 2}
                maxFractionDigits={moneda === "PYG" ? 0 : 2}
                onValueChange={(e) => setAnticipo(Math.max(Number(e.value ?? 0), 0))}
              />
            </div>
          </div>

          <div className="facturacion-summary">
            <ResumenMonto label="Exenta" value={formatMoney(resumen.totalExenta, moneda)} />
            <ResumenMonto label="Subtotal IVA 5" value={formatMoney(resumen.subtotalIva5, moneda)} />
            <ResumenMonto label="Subtotal IVA 10" value={formatMoney(resumen.subtotalIva10, moneda)} />
            <ResumenMonto label="IVA 5" value={formatMoney(resumen.liquidacionIva5, moneda)} />
            <ResumenMonto label="IVA 10" value={formatMoney(resumen.liquidacionIva10, moneda)} />
            <ResumenMonto label="Total IVA" value={formatMoney(resumen.totalIva, moneda)} />
          </div>

          <div className="facturacion-summary-total">
            <ResumenFila label="Ítems registrados" value={items.length.toString()} />
            <ResumenFila label="Total venta" value={formatMoney(totalAbonar, moneda)} />
            <ResumenFila label="Descuento" value={formatMoney(totalDescuento, moneda)} />
            <ResumenFila label="Anticipo" value={formatMoney(totalAnticipo, moneda)} />
            <ResumenFila label="Total a abonar" value={formatMoney(totalNeto, moneda)} destacado />
          </div>

          <Button
            className="w-full mt-3"
            icon={esContado ? "pi pi-credit-card" : "pi pi-check"}
            label={esContado ? "Cobrar" : "Facturar"}
            severity="success"
            disabled={!items.length}
            onClick={esContado ? abrirCobro : facturarACredito}
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
          <ResumenMonto label="Total venta" value={formatMoney(totalAbonar, moneda)} />
          <ResumenMonto label="Descuento" value={formatMoney(totalDescuento, moneda)} />
          <ResumenMonto label="Anticipo" value={formatMoney(totalAnticipo, moneda)} />
          <ResumenMonto label="Total neto" value={formatMoney(totalNeto, moneda)} destacado />
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

        {isMobile ? (
          pagos.length === 0 ? (
            <div className="factura-items-empty">No hay formas de pago cargadas</div>
          ) : (
            <div>
              {pagos.map((pago, index) => {
                const esUltimo = index === pagos.length - 1;
                const pagoVuelto = esUltimo && vuelto > 0 && pago.formaPago === "EFECTIVO" ? vuelto : 0;
                return (
                  <div key={pago.id} className="factura-item-card">
                    <div className="factura-item-card-header">
                      <div>
                        <div className="factura-item-card-title">{formaPagoLabel(pago.formaPago)}</div>
                        {pago.referencia && (
                          <div className="factura-item-card-code">Ref: {pago.referencia}</div>
                        )}
                      </div>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        text
                        rounded
                        onClick={() => eliminarPago(pago.id)}
                      />
                    </div>

                    <div className="factura-item-card-totals">
                      <div className="factura-item-card-total-cell" style={{ gridColumn: pagoVuelto > 0 ? "1" : "1 / -1" }}>
                        <div className="cell-label">Monto</div>
                        <div className="cell-value">{formatMoney(pago.monto, moneda)}</div>
                      </div>
                      {pagoVuelto > 0 && (
                        <div className="factura-item-card-total-cell" style={{ gridColumn: "2 / -1" }}>
                          <div className="cell-label">Vuelto</div>
                          <div className="cell-value" style={{ color: "#f97316" }}>{formatMoney(pagoVuelto, moneda)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <DataTable
            value={pagos}
            size="small"
            emptyMessage="No hay formas de pago cargadas"
          >
            <Column header="Forma de pago" body={formaPagoTablaBody} style={{ minWidth: "180px" }} />
            <Column header="Monto" body={montoPagoTablaBody} style={{ minWidth: "160px" }} />
            <Column header="Vuelto" body={vueltoTablaBody} style={{ minWidth: "140px" }} />
            <Column header="Referencia" body={referenciaPagoTablaBody} />
            <Column body={accionesPagoBody} style={{ width: "70px" }} />
          </DataTable>
        )}
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
        borderRadius: 4,
        minWidth: 0
      }}
    >
      <div className="text-color-secondary text-sm">{label}</div>
      <div
        className={destacado ? "text-2xl font-bold" : "text-lg font-semibold"}
        style={{ overflowWrap: "anywhere" }}
      >
        {value}
      </div>
    </div>
  );
}

function ResumenFila({
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
      className="flex align-items-baseline justify-content-between gap-2"
      style={{ padding: destacado ? ".5rem 0 0" : ".2rem 0" }}
    >
      <span className={destacado ? "font-semibold" : "text-color-secondary text-sm"}>
        {label}
      </span>
      <span
        className={destacado ? "text-xl font-bold" : "font-medium"}
        style={{ overflowWrap: "anywhere", textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}
