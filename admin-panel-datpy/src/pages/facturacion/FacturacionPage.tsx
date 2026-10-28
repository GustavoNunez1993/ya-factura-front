import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { CondicionVentaService, type CondicionVenta } from "../../services/CondicionVentaService";
import { CotizacionService } from "../../services/CotizacionService";
import { PuntoExpedicionService } from "../../services/PuntoExpedicionService";
import { avisarFalloEnvioSifen } from "../../utils/sifen";
import { verificarCajaAbierta } from "../../utils/caja";

interface Persona {
  id: string;
  razonSocial: string;
  ruc?: string;
  dv?: string;
  nroDocumento?: string;
  direccion?: string;
}

interface ProductoStockDeposito {
  depositoId: string;
  depositoNombre: string;
  stock: number;
}

/**
 * Una opción del selector por producto y depósito: así se elige de dónde se descuenta. Los
 * productos sin stock cargado en ningún depósito tienen una sola opción sin depósito (el back
 * usa el de venta por defecto). descripcion/codigo/codigoBarra/depositoNombre van arriba para el filtro.
 */
interface OpcionProducto {
  clave: string;
  producto: Producto;
  depositoId: string | null;
  depositoNombre: string | null;
  stock: number;
  descripcion: string;
  codigo: string;
  codigoBarra?: string;
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
  /** Depósito del que se descuenta; null = depósito de venta por defecto. */
  depositoId: string | null;
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

/** Ítem y cobro tal como los devuelve GET /facturas/{id} (para editar la factura). */
interface DetalleFacturaGuardada {
  productoId: string;
  depositoId?: string | null;
  codigo?: string | null;
  descripcion?: string | null;
  cantidad?: number | null;
  precioUnitario?: number | null;
  tasaIva?: number | null;
}

interface PagoFacturaGuardada {
  formaPago?: string | null;
  monto?: number | null;
  referencia?: string | null;
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

const formasPago = [
  { label: "Efectivo", value: "EFECTIVO" },
  { label: "Tarjeta", value: "TARJETA" },
  { label: "Cheque", value: "CHEQUE" },
  { label: "Transferencia", value: "TRANSFERENCIA" },
  { label: "QR", value: "QR" },
  { label: "Billetera", value: "BILLETERA" },
  { label: "Otro", value: "OTRO" }
];

/**
 * Decimales con que se opera en cada moneda: guaraníes sin decimales, extranjeras con 2 (los
 * mismos que se muestran y que acepta el campo de monto). Precios, subtotales y totales se
 * redondean a esto para que lo que se ve, lo que se cobra y lo que se envía al back coincidan
 * exactamente: el back rechaza la factura si los pagos no suman el total.
 */
const decimalesMoneda = (currency = "PYG") => (currency === "PYG" ? 0 : 2);

const redondear = (value: number, currency = "PYG") => {
  const factor = 10 ** decimalesMoneda(currency);
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const formatMoney = (value: number, currency = "PYG") =>
  new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "PYG" ? 0 : 2
  }).format(value || 0);

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

const recalcularItem = (item: FacturaItem, currency: string): FacturaItem => {
  const subtotal = redondear(item.cantidad * item.precioUnitario, currency);

  return {
    ...item,
    exenta: item.porcentajeIva === 0 ? subtotal : 0,
    iva5: item.porcentajeIva === 5 ? subtotal : 0,
    iva10: item.porcentajeIva === 10 ? subtotal : 0
  };
};

export default function FacturacionPage() {
  const navigate = useNavigate();
  // Con id: edición de una factura sin enviar, con error o rechazada por SIFEN (se reprocesa).
  const { id: facturaEditId } = useParams<{ id: string }>();
  const [facturaEditada, setFacturaEditada] = useState<{ numeracion: string; puntoOriginal: string } | null>(null);
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
  // Tipo de cambio real, cargado desde /api/cotizaciones (pantalla
  // "Cotizaciones" en Configuraciones) — no hay ningún valor hardcodeado
  // acá. Sólo incluye las monedas con un valor cargado; PYG siempre está
  // en 1. Una moneda sin cotización cargada simplemente no aparece en el
  // selector de "Moneda" más abajo.
  const [cotizaciones, setCotizaciones] = useState<Record<string, number>>({ PYG: 1 });
  const [puntoExpedicion, setPuntoExpedicion] = useState("");
  // Puntos (establecimiento-punto) activos y con timbrado activo de la empresa.
  const [puntosExpedicion, setPuntosExpedicion] = useState<{ label: string; value: string }[]>([]);
  // Número que probablemente reciba la factura (el real lo asigna el back al guardar), por punto.
  const [siguienteNumero, setSiguienteNumero] = useState<{ punto: string; valor: string; error: boolean } | null>(null);
  const [descuento, setDescuento] = useState<number>(0);
  const [anticipo, setAnticipo] = useState<number>(0);
  const [opcionProductoClave, setOpcionProductoClave] = useState<string | null>(null);
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

  const convertirDesdeGuaranies = (value: number, currency = "PYG") =>
    value / (cotizaciones[currency] ?? 1);

  const convertirAGuaranies = (value: number, currency = "PYG") =>
    value * (cotizaciones[currency] ?? 1);

  // Sólo se ofrecen las monedas con cotización cargada — evita facturar en
  // una moneda cuyo tipo de cambio nadie cargó todavía en "Cotizaciones".
  const monedasDisponibles = monedas.filter((m) => cotizaciones[m.value] != null);

  const totalAbonar = useMemo(
    () => redondear(items.reduce((total, item) => total + item.exenta + item.iva5 + item.iva10, 0), moneda),
    [items, moneda]
  );

  const totalDescuento = Math.max(descuento, 0);
  const totalAnticipo = Math.max(anticipo, 0);
  const totalNeto = Math.max(redondear(totalAbonar - totalDescuento - totalAnticipo, moneda), 0);

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
    () => redondear(pagos.reduce((total, pago) => total + pago.monto, 0), moneda),
    [pagos, moneda]
  );

  const saldoPendiente = Math.max(redondear(totalNeto - totalPagado, moneda), 0);
  const vuelto = Math.max(redondear(totalPagado - totalNeto, moneda), 0);
  const tableScrollHeight = `${Math.min(Math.max(items.length * 56 + 56, 180), 520)}px`;

  const condicionSeleccionada = useMemo(
    () => condiciones.find((c) => c.id === condicionVentaId) ?? null,
    [condiciones, condicionVentaId]
  );

  const esContado = (condicionSeleccionada?.tipoOperacion ?? 1) === 1;

  const cargarPuntosExpedicion = async () => {
    const empresaId = localStorage.getItem("empresaId");
    if (!empresaId) return;
    try {
      const opciones = await PuntoExpedicionService.opcionesActivas(empresaId);
      setPuntosExpedicion(opciones);
      // Con un único punto no hay nada que elegir: se preselecciona (sin pisar el de una factura en edición).
      if (opciones.length === 1) setPuntoExpedicion((actual) => actual || opciones[0].value);
    } catch (error) {
      console.error("Error cargando puntos de expedición", error);
      setPuntosExpedicion([]);
    }
  };

  const cargarDatos = async () => {
    cargarPuntosExpedicion();
    try {
      const [clientesRes, productosRes, canalesRes, vendedoresRes, condicionesRes, cotizacionesRes] =
        await Promise.all([
          PersonaService.getPaginated(0, 1000, ""),
          ProductosService.getPaginated(0, 1000, ""),
          CanalVentaService.getAll(),
          VendedorService.getAll(),
          CondicionVentaService.getActivas(),
          CotizacionService.getAll()
        ]);

      setClientes(clientesRes?.content ?? []);
      setProductos(productosRes?.content ?? []);
      setCanalesVenta(canalesRes ?? []);
      setVendedores(vendedoresRes ?? []);
      setCondiciones(condicionesRes ?? []);
      setCotizaciones(
        Object.fromEntries(
          (cotizacionesRes ?? [])
            .filter((c) => c.valor != null)
            .map((c) => [c.codigoMoneda, c.valor as number])
        )
      );

      const predeterminada = (condicionesRes ?? []).find((c) => c.predeterminada) ?? (condicionesRes ?? [])[0];
      if (predeterminada) {
        setCondicionVentaId(predeterminada.id);
      }

      if (facturaEditId) {
        await cargarFacturaParaEditar(facturaEditId, condicionesRes ?? []);
      }
    } catch (error) {
      console.error("Error cargando datos de facturación", error);
      setClientes([]);
      setProductos([]);
      setCanalesVenta([]);
      setVendedores([]);
      setCondiciones([]);
      setCotizaciones({ PYG: 1 });
    }
  };

  const cargarFacturaParaEditar = async (id: string, condicionesDisponibles: CondicionVenta[]) => {
    const factura = await FacturaService.getById(id);
    if (!factura?.editable) {
      await Swal.fire(
        "No se puede editar",
        "Sólo se pueden editar facturas sin enviar, con error de envío o rechazadas por SIFEN.",
        "warning"
      );
      navigate("/facturacion");
      return;
    }

    const codigoMoneda = ({ 1: "PYG", 2: "USD", 3: "BRL", 4: "EUR" } as Record<number, string>)[factura.monedaId] ?? "PYG";
    const cotizacion = Number(factura.cotizacion ?? 1) || 1;
    const condicion =
      condicionesDisponibles.find((c) => c.tipoOperacion === factura.condicionOperacionId && c.predeterminada) ??
      condicionesDisponibles.find((c) => c.tipoOperacion === factura.condicionOperacionId);
    const punto = `${factura.dEst}-${factura.dPunExp}`;

    setClienteId(factura.clienteId ?? null);
    setCanalVentaId(factura.canalVentaId ?? null);
    setVendedorSeleccionadoId(factura.vendedorSeleccionadoId ?? null);
    if (condicion) setCondicionVentaId(condicion.id);
    setMoneda(codigoMoneda);
    setPuntoExpedicion(punto);
    if (factura.dFeEmiDE) setFecha(startOfDay(new Date(factura.dFeEmiDE)));
    setDescuento(Number(factura.subtotal?.descuento ?? 0));
    setAnticipo(Number(factura.subtotal?.anticipo ?? 0));
    setItems(
      (factura.detalles ?? []).map((d: DetalleFacturaGuardada) =>
        recalcularItem({
          id: crypto.randomUUID(),
          productoId: d.productoId,
          depositoId: d.depositoId ?? null,
          codigo: d.codigo ?? "",
          cantidad: Number(d.cantidad ?? 0),
          descripcion: d.descripcion ?? "",
          precioUnitario: Number(d.precioUnitario ?? 0),
          precioUnitarioBase: Number(d.precioUnitario ?? 0) * cotizacion,
          porcentajeIva: Number(d.tasaIva ?? 0),
          exenta: 0,
          iva5: 0,
          iva10: 0
        }, codigoMoneda)
      )
    );
    setPagos(
      (factura.pagos ?? []).map((p: PagoFacturaGuardada) => ({
        id: crypto.randomUUID(),
        formaPago: p.formaPago ?? "EFECTIVO",
        monto: Number(p.monto ?? 0),
        referencia: p.referencia ?? ""
      }))
    );
    setFacturaEditada({ numeracion: `${punto}-${factura.dNumDoc}`, puntoOriginal: punto });
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Al editar sin cambiar de punto, la factura conserva su número.
  const conservaNumero = facturaEditada !== null && puntoExpedicion === facturaEditada.puntoOriginal;

  useEffect(() => {
    const [establecimiento, punto] = puntoExpedicion.split("-");
    const empresaId = localStorage.getItem("empresaId");
    if (!establecimiento || !punto || !empresaId || conservaNumero) return;

    let vigente = true;
    PuntoExpedicionService.siguienteNumero(empresaId, establecimiento, punto)
      .then(({ dNumDoc, dSerieNum }) => {
        if (!vigente) return;
        const serie = dSerieNum ? ` (serie ${dSerieNum})` : "";
        setSiguienteNumero({ punto: puntoExpedicion, valor: `${puntoExpedicion}-${dNumDoc}${serie}`, error: false });
      })
      .catch((error) => {
        if (!vigente) return;
        const sinTimbrado = (error as { response?: { status?: number } })?.response?.status === 404;
        setSiguienteNumero({
          punto: puntoExpedicion,
          valor: sinTimbrado ? "Sin timbrado activo" : "No se pudo consultar el número",
          error: true
        });
      });
    return () => {
      vigente = false;
    };
  }, [puntoExpedicion, conservaNumero]);

  // Al editar, el punto original se ofrece aunque su timbrado ya no esté activo.
  const opcionesPuntoExpedicion =
    puntoExpedicion && !puntosExpedicion.some((p) => p.value === puntoExpedicion)
      ? [...puntosExpedicion, { label: puntoExpedicion, value: puntoExpedicion }]
      : puntosExpedicion;

  const numeroProbable = conservaNumero
    ? { valor: facturaEditada.numeracion, error: false }
    : siguienteNumero?.punto === puntoExpedicion ? siguienteNumero : null;

  useEffect(() => {
    verificarCajaAbierta("Volver al listado").then((ok) => {
      if (!ok) navigate("/facturacion");
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

  const opcionesProducto: OpcionProducto[] = useMemo(
    () =>
      productos.flatMap((producto): OpcionProducto[] => {
        const base = { producto, descripcion: producto.descripcion, codigo: producto.codigo, codigoBarra: producto.codigoBarra };
        const depositos = producto.stockPorDeposito ?? [];
        if (depositos.length === 0) {
          return [{ ...base, clave: `${producto.id}|`, depositoId: null, depositoNombre: null, stock: 0 }];
        }
        return depositos.map((d) => ({
          ...base,
          clave: `${producto.id}|${d.depositoId}`,
          depositoId: d.depositoId,
          depositoNombre: d.depositoNombre,
          stock: d.stock
        }));
      }),
    [productos]
  );

  const nombreDeposito = (productoId: string, depositoId: string | null) => {
    if (!depositoId) return "Depósito por defecto";
    return (
      productos.find((p) => p.id === productoId)?.stockPorDeposito?.find((d) => d.depositoId === depositoId)
        ?.depositoNombre ?? "—"
    );
  };

  const opcionProductoTemplate = (opcion: OpcionProducto) => {
    if (!opcion) return null;
    const { producto } = opcion;
    const sinStock = opcion.stock <= 0;

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
          <i className="pi pi-box mr-1 text-color-secondary" style={{ fontSize: ".8rem" }} />
          {opcion.depositoNombre ? (
            <>
              <span className="font-semibold">{opcion.depositoNombre}</span>
              {" · "}
              <span className={sinStock ? "text-red-500 font-semibold" : "text-green-600"}>
                Stock: {formatStock(opcion.stock)}
              </span>
            </>
          ) : (
            <span className="text-red-500 font-semibold">Sin stock cargado</span>
          )}
        </div>
      </div>
    );
  };

  const opcionProductoValueTemplate = (opcion: OpcionProducto) => {
    if (!opcion) return "Seleccione producto";
    return (
      <span>
        {opcion.producto.codigo} - {opcion.producto.descripcion}
        {" | "}
        {formatMoney(convertirDesdeGuaranies(opcion.producto.precioVenta ?? 0, moneda), moneda)}
        {" | "}
        {opcion.depositoNombre ? `${opcion.depositoNombre}: ${formatStock(opcion.stock)}` : "Sin stock cargado"}
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
          precioUnitario: redondear(convertirDesdeGuaranies(precioUnitarioBase, value), value)
        }, value);
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
    setOpcionProductoClave(null);
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
    const opcion = opcionesProducto.find((o) => o.clave === opcionProductoClave);
    const producto = opcion?.producto;

    if (!opcion || !producto) {
      Swal.fire("Atención", "Seleccione un producto", "warning");
      return;
    }

    if (!cantidad || cantidad <= 0) {
      Swal.fire("Atención", "La cantidad debe ser mayor a cero", "warning");
      return;
    }

    const itemExistente = items.find(
      (item) => item.productoId === producto.id && item.depositoId === opcion.depositoId
    );

    // El back permite vender sin stock (queda como faltante), pero se avisa antes.
    const pedido = cantidad + (itemExistente?.cantidad ?? 0);
    if (opcion.depositoNombre && pedido > opcion.stock) {
      const aviso = await Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        text: `En ${opcion.depositoNombre} hay ${formatStock(opcion.stock)} de ${producto.descripcion} y está facturando ${formatStock(pedido)}. ¿Agregar igual?`,
        showCancelButton: true,
        confirmButtonText: "Sí, agregar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#4361ee",
        cancelButtonColor: "#6b7280"
      });
      if (!aviso.isConfirmed) return;
    }

    if (itemExistente) {
      const result = await Swal.fire({
        icon: "question",
        title: "Producto que desea agregar a la factura ya existe en la lista",
        text: `Ya hay un ítem de este producto desde ${opcion.depositoNombre ?? "el depósito por defecto"}. ¿Desea sumar la cantidad?`,
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
        }, moneda);

        return [
          itemActualizado,
          ...prev.filter((item) => item.id !== itemExistente.id)
        ];
      });

      limpiarCargaProducto();
      return;
    }

    const precioUnitarioBase = producto.precioVenta ?? 0;
    const precioUnitario = redondear(convertirDesdeGuaranies(precioUnitarioBase, moneda), moneda);
    const porcentajeIva = producto.porcentajeIva ?? 10;

    const nuevoItem = recalcularItem({
      id: crypto.randomUUID(),
      productoId: producto.id,
      depositoId: opcion.depositoId,
      codigo: producto.codigo,
      cantidad,
      descripcion: producto.descripcion,
      precioUnitario,
      precioUnitarioBase,
      porcentajeIva,
      exenta: 0,
      iva5: 0,
      iva10: 0
    }, moneda);

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
        }, moneda);
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

  const limpiarFacturacion = () => {
    setFecha(hoy);
    setClienteId(null);
    setCanalVentaId(null);
    setVendedorSeleccionadoId(null);
    setCondicionVentaId(condiciones.find((c) => c.predeterminada)?.id ?? condiciones[0]?.id ?? null);
    setMoneda("PYG");
    setPuntoExpedicion(puntosExpedicion.length === 1 ? puntosExpedicion[0].value : "");
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

    // Tipo de cambio global (una cotización para todo el comprobante); en PYG no corresponde.
    dCondTiCam: moneda === "PYG" ? null : "1",
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
        depositoId: item.depositoId,

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

    const facturaCreada = facturaEditId
      ? await FacturaService.update(facturaEditId, payload)
      : await FacturaService.create(payload);

    if (facturaEditId) {
      await Swal.fire("Factura actualizada", "La factura se corrigió y quedó lista para reprocesar en SIFEN", "success");
    } else {
      await Swal.fire("Cobro registrado", "La venta quedó registrada correctamente", "success");
    }
    await avisarFalloEnvioSifen(facturaCreada);
    setCobroVisible(false);
    limpiarFacturacion();
    navigate("/facturacion");
  } catch (error: unknown) {
    console.error("Error registrando factura", error);
    const mensaje = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    Swal.fire("Error", mensaje || "No se pudo registrar la factura", "error");
  }
};

const facturarACredito = async () => {
  try {
    const payload = crearFacturaPayload();

    const facturaCreada = facturaEditId
      ? await FacturaService.update(facturaEditId, payload)
      : await FacturaService.create(payload);

    if (facturaEditId) {
      await Swal.fire("Factura actualizada", "La factura se corrigió y quedó lista para reprocesar en SIFEN", "success");
    } else {
      await Swal.fire("Factura registrada", "La venta a crédito quedó registrada correctamente", "success");
    }
    await avisarFalloEnvioSifen(facturaCreada);
    limpiarFacturacion();
    navigate("/facturacion");
  } catch (error: unknown) {
    console.error("Error registrando factura", error);
    const mensaje = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    Swal.fire("Error", mensaje || "No se pudo registrar la factura", "error");
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
            gap: .25rem;
          }

          /* Descuento y anticipo lado a lado (PrimeFlex no tiene grid-cols-2). */
          .facturacion-summary-ajustes {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: .5rem;
          }

          .facturacion-summary-ajustes label {
            font-size: .875rem;
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
            margin-top: .5rem;
            padding-top: .5rem;
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
        <h2 className="m-0">{facturaEditId ? `Editar factura ${facturaEditada?.numeracion ?? ""}` : "Facturación"}</h2>
        <small className="text-color-secondary">
          {facturaEditId
            ? "Corrija la factura y vuelva a confirmarla para reprocesarla en SIFEN"
            : "Carga de comprobante de venta"}
        </small>
        {facturaEditada && (
          <small className={puntoExpedicion === facturaEditada.puntoOriginal ? "text-color-secondary" : "text-orange-500 font-semibold"}>
            {puntoExpedicion === facturaEditada.puntoOriginal
              ? `Se mantiene el número ${facturaEditada.numeracion}.`
              : `Cambió el punto de expedición: se asignará un número nuevo de ${puntoExpedicion} y el ${facturaEditada.numeracion} quedará sin usar.`}
          </small>
        )}
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
            options={monedasDisponibles}
            emptyMessage="Sin cotizaciones cargadas"
            onChange={(e) => cambiarMoneda(e.value)}
          />
          {monedasDisponibles.length < monedas.length && (
            <small className="text-500">
              Faltan cotizaciones por cargar en Configuraciones &gt; Cotizaciones.
            </small>
          )}
        </div>

        <div className="col-6 sm:col-6 md:col-2">
          <label>Punto de expedición</label>
          <Dropdown
            className="w-full"
            value={puntoExpedicion}
            options={opcionesPuntoExpedicion}
            placeholder="Seleccione punto"
            emptyMessage="Sin puntos activos (cargarlos en Puntos de Expedición)"
            onChange={(e) => setPuntoExpedicion(e.value)}
          />
        </div>
      </div>

      <div className="facturacion-detail-layout mt-1">
        <div className="facturacion-table-wrap">
          {/* Datos de la venta y carga de productos van en esta columna: así el resumen arranca
              justo debajo de la primera fila y usa el alto de la pantalla. */}
          <div className="grid">
            <div className="col-6 sm:col-6 md:col-4">
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

            <div className="col-6 sm:col-6 md:col-4">
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

            <div className="col-6 sm:col-6 md:col-4">
              <label>N° de comprobante (probable)</label>
              <InputText
                className={`w-full${numeroProbable?.error ? " p-invalid" : ""}`}
                value={numeroProbable?.valor ?? ""}
                placeholder="Seleccione punto de expedición"
                readOnly
                tabIndex={-1}
              />
              <small className="text-500">El número definitivo se asigna al guardar.</small>
            </div>
          </div>

          <div className="grid align-items-end mb-2">
            <div className="col-12 sm:col-12 md:col-7">
              <label>Producto</label>
              <Dropdown
                key={productoSelectorKey}
                className="w-full"
                value={opcionProductoClave}
                options={opcionesProducto}
                optionLabel="descripcion"
                optionValue="clave"
                itemTemplate={opcionProductoTemplate}
                valueTemplate={opcionProductoValueTemplate}
                placeholder="Seleccione producto"
                panelClassName="factura-product-dropdown"
                scrollHeight="420px"
                filter
                filterBy="descripcion,codigo,codigoBarra,depositoNombre"
                filterInputAutoFocus
                showClear
                resetFilterOnHide
                onChange={(e) => {
                  setOpcionProductoClave(e.value);
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
                // onChange y no onValueChange: este último recién se dispara al salir del campo, y con
                // Enter nuestro onKeyDown corre antes, así que agregarProducto leía la cantidad anterior.
                onChange={(e) => setCantidad(e.value ?? null)}
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
                        <div className="factura-item-card-code">
                          Código: {item.codigo} · {nombreDeposito(item.productoId, item.depositoId)}
                        </div>
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
              <Column
                header="Depósito"
                body={(item: FacturaItem) => nombreDeposito(item.productoId, item.depositoId)}
                style={{ width: "140px" }}
              />
              <Column header="Precio unitario" body={precioUnitarioBody} style={{ width: "152px" }} />
              <Column header="Exenta" body={moneyBody("exenta")} />
              <Column header="IVA 5" body={moneyBody("iva5")} />
              <Column header="IVA 10" body={moneyBody("iva10")} />
              <Column body={accionesBody} style={{ width: "70px" }} />
            </DataTable>
          )}
        </div>

        <aside className="facturacion-summary-panel">
          <div className="text-lg font-semibold mb-2">Resumen</div>

          <div className="facturacion-summary-ajustes mb-2">
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
            <ResumenMonto compacto label="Exenta" value={formatMoney(resumen.totalExenta, moneda)} />
            <ResumenMonto compacto label="Subtotal IVA 5" value={formatMoney(resumen.subtotalIva5, moneda)} />
            <ResumenMonto compacto label="Subtotal IVA 10" value={formatMoney(resumen.subtotalIva10, moneda)} />
            <ResumenMonto compacto label="IVA 5" value={formatMoney(resumen.liquidacionIva5, moneda)} />
            <ResumenMonto compacto label="IVA 10" value={formatMoney(resumen.liquidacionIva10, moneda)} />
            <ResumenMonto compacto label="Total IVA" value={formatMoney(resumen.totalIva, moneda)} />
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
  destacado = false,
  compacto = false
}: {
  label: string;
  value: string;
  destacado?: boolean;
  /** Para el panel lateral angosto: menos alto y el monto en una sola línea. */
  compacto?: boolean;
}) {
  return (
    <div
      className={compacto ? "px-2 py-1" : "px-2 py-2"}
      style={{
        background: destacado ? "#f8fafc" : "#ffffff",
        borderRadius: 4,
        minWidth: 0
      }}
    >
      <div className="text-color-secondary text-sm">{label}</div>
      <div
        className={destacado ? "text-2xl font-bold" : compacto ? "font-semibold" : "text-lg font-semibold"}
        style={compacto ? { whiteSpace: "nowrap" } : { overflowWrap: "anywhere" }}
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
