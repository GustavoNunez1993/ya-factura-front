import { CuentaCorrienteService, type CobroReciente, type FormaPagoResumen } from "./CuentaCorrienteService";
import { FacturaService, type MontoMoneda } from "./FacturaService";
import { PersonaService } from "./PersonaService";
import { ProductosService } from "./ProductosService";
import { StockService, type StockItem } from "./StockService";

export interface FacturaResumen {
  id: string;
  dNumDoc: string;
  dFeEmiDE: string;
  clienteRazonSocial: string;
  total: number;
  /** Moneda del comprobante: el total está en esa moneda. */
  monedaId?: number | null;
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
  /** Total de los vigentes, uno por moneda. */
  totales: MontoMoneda[];
}

export interface DashboardResumen {
  /** Ventas netas (facturas + ND − NC, sin anulados), una por moneda. */
  ventasPorMoneda: MontoMoneda[];
  /** Ventas netas de todas las monedas convertidas a guaraníes con la cotización de cada comprobante. */
  ventasEquivalenteGs: number;
  facturasEmitidasPeriodo: number;
  documentosEmitidosPeriodo: number;
  documentosPorTipo: DocumentoPorTipo[];
  productosActivos: number;
  productosInactivos: number;
  clientesActivos: number;
  /** En equivalente guaraníes. */
  tendenciaVentas: { label: string; total: number }[];
  facturacionSemanal: { label: string; cantidad: number }[];
  facturasRecientes: FacturaResumen[];
  facturasPendientes: FacturaResumen[];
  cobrosPorMoneda: MontoMoneda[];
  saldoPendientePorMoneda: MontoMoneda[];
  cobrosPorFormaPago: FormaPagoResumen[];
  ultimosCobros: CobroReciente[];
  productosPorVencer: StockItem[];
}

const MAX_REGISTROS = 5000;

/** {monedaId: total} del back -> lista ordenada por moneda, sin las que dan 0. */
const porMoneda = (mapa?: Record<string, number>): MontoMoneda[] =>
  Object.entries(mapa ?? {})
    .map(([monedaId, total]) => ({ monedaId: Number(monedaId), total: Number(total) || 0 }))
    .filter((m) => m.total !== 0)
    .sort((a, b) => a.monedaId - b.monedaId);

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
        totalCobradoPorMoneda: {},
        totalPendiente: 0,
        totalPendientePorMoneda: {},
        porFormaPago: [],
        ultimosCobros: []
      })),
      StockService.getPorVencer(15).catch(() => [])
    ]);

    const productosActivos = productos.filter((p) => p.active).length;

    return {
      ventasPorMoneda: comprobantes.porMoneda.map((m) => ({ monedaId: m.monedaId, total: Number(m.ventasNetas) || 0 })),
      ventasEquivalenteGs: Number(comprobantes.ventasNetasEquivalenteGs) || 0,
      facturasEmitidasPeriodo: comprobantes.facturasEmitidas,
      documentosEmitidosPeriodo: comprobantes.documentosEmitidos,
      documentosPorTipo: comprobantes.porTipo.map((t) => ({
        ...t,
        totales: (t.totales ?? []).map((m) => ({ monedaId: m.monedaId, total: Number(m.total) || 0 }))
      })),
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
      cobrosPorMoneda: porMoneda(cobrosResumen.totalCobradoPorMoneda),
      saldoPendientePorMoneda: porMoneda(cobrosResumen.totalPendientePorMoneda),
      cobrosPorFormaPago: cobrosResumen.porFormaPago ?? [],
      ultimosCobros: cobrosResumen.ultimosCobros ?? [],
      productosPorVencer: productosPorVencer ?? []
    };
  }
};
