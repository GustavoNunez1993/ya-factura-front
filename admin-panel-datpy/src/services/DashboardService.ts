import { CuentaCorrienteService, type CobroReciente, type FormaPagoResumen } from "./CuentaCorrienteService";
import { FacturaService } from "./FacturaService";
import { PersonaService } from "./PersonaService";
import { ProductosService } from "./ProductosService";
import { StockService, type StockItem } from "./StockService";

export interface FacturaResumen {
  id: string;
  dNumDoc: string;
  dFeEmiDE: string;
  clienteRazonSocial: string;
  total: number;
  estado: string;
}

export interface ProductoResumen {
  id: string;
  active: boolean;
}

export interface DocumentoPorTipo {
  /** iTiDE: 1 FE · 4 AFE · 5 NCE · 6 NDE · 7 NRE. */
  tipo: number;
  emitidos: number;
  anulados: number;
  total: number;
}

export interface DashboardResumen {
  /** Ventas netas: facturas + notas de débito − notas de crédito (sin anulados). */
  ventasPeriodo: number;
  facturasEmitidasPeriodo: number;
  documentosEmitidosPeriodo: number;
  documentosPorTipo: DocumentoPorTipo[];
  comprasPeriodo: number;
  productosActivos: number;
  productosInactivos: number;
  clientesActivos: number;
  tendenciaVentas: { label: string; total: number }[];
  facturacionSemanal: { label: string; cantidad: number }[];
  facturasRecientes: FacturaResumen[];
  facturasPendientes: FacturaResumen[];
  cobrosPeriodo: number;
  saldoPendienteCobro: number;
  cobrosPorFormaPago: FormaPagoResumen[];
  ultimosCobros: CobroReciente[];
  productosPorVencer: StockItem[];
}

const MAX_REGISTROS = 5000;

export const formatFecha = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchTodosLosProductos = async (): Promise<ProductoResumen[]> => {
  const primera = await ProductosService.getPaginated(0, 1, "");
  const total = primera.totalElements ?? 0;

  if (total === 0) {
    return [];
  }

  const completa = await ProductosService.getPaginated(
    0,
    Math.min(total, MAX_REGISTROS),
    ""
  );

  return completa.content ?? [];
};

export const DashboardService = {
  /**
   * Los números de comprobantes (ventas, cantidades por tipo, tendencia, semana) los calcula
   * el back en GET /facturas/resumen; acá sólo se piden y se adaptan para los gráficos.
   */
  async getResumen(fechaDesde: Date, fechaHasta: Date): Promise<DashboardResumen> {
    const desde = formatFecha(fechaDesde);
    const hasta = formatFecha(fechaHasta);

    const [comprobantes, recientes, credito, productos, clientesPage, cobrosResumen, productosPorVencer] = await Promise.all([
      FacturaService.getResumen(desde, hasta),
      FacturaService.getPaginated(0, 5, "", { fechaDesde: desde, fechaHasta: hasta, tipoDocumento: 1 }),
      FacturaService.getPaginated(0, 50, "", {
        fechaDesde: desde,
        fechaHasta: hasta,
        tipoDocumento: 1,
        condicionVenta: "CREDITO"
      }),
      fetchTodosLosProductos(),
      PersonaService.getPaginated(0, 1, ""),
      CuentaCorrienteService.getResumenCobros(desde, hasta).catch(() => ({
        totalCobrado: 0,
        totalPendiente: 0,
        porFormaPago: [],
        ultimosCobros: []
      })),
      StockService.getPorVencer(15).catch(() => [])
    ]);

    const productosActivos = productos.filter((p) => p.active).length;

    return {
      ventasPeriodo: Number(comprobantes.ventasNetas) || 0,
      facturasEmitidasPeriodo: comprobantes.facturasEmitidas,
      documentosEmitidosPeriodo: comprobantes.documentosEmitidos,
      documentosPorTipo: comprobantes.porTipo.map((t) => ({ ...t, total: Number(t.total) || 0 })),
      comprasPeriodo: Number(comprobantes.compras) || 0,
      productosActivos,
      productosInactivos: productos.length - productosActivos,
      clientesActivos: clientesPage.totalElements ?? 0,
      tendenciaVentas: comprobantes.tendenciaVentas.map((m) => ({
        label: new Date(m.anio, m.mes - 1, 1).toLocaleDateString("es-PY", { month: "short" }),
        total: Number(m.ventasNetas) || 0
      })),
      facturacionSemanal: comprobantes.facturasUltimos7Dias.map((d) => ({
        label: new Date(`${d.fecha}T00:00:00`).toLocaleDateString("es-PY", { weekday: "short" }),
        cantidad: d.facturas
      })),
      facturasRecientes: recientes?.content ?? [],
      facturasPendientes: ((credito?.content ?? []) as FacturaResumen[])
        .filter((f) => f.estado === "Pendiente")
        .slice(0, 4),
      cobrosPeriodo: Number(cobrosResumen.totalCobrado) || 0,
      saldoPendienteCobro: Number(cobrosResumen.totalPendiente) || 0,
      cobrosPorFormaPago: cobrosResumen.porFormaPago ?? [],
      ultimosCobros: cobrosResumen.ultimosCobros ?? [],
      productosPorVencer: productosPorVencer ?? []
    };
  }
};
