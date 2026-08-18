import { FacturaService } from "./FacturaService";
import { PersonaService } from "./PersonaService";
import { ProductosService } from "./ProductosService";

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

export interface DashboardResumen {
  ventasPeriodo: number;
  facturasEmitidasPeriodo: number;
  productosActivos: number;
  productosInactivos: number;
  clientesActivos: number;
  tendenciaVentas: { label: string; total: number }[];
  facturacionSemanal: { label: string; cantidad: number }[];
  facturasRecientes: FacturaResumen[];
  facturasPendientes: FacturaResumen[];
}

const MAX_REGISTROS = 5000;

export const formatFecha = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mismoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const dentroDeRango = (fecha: Date, desde: Date, hasta: Date) =>
  fecha.getTime() >= desde.getTime() && fecha.getTime() <= hasta.getTime();

const fetchTodasLasFacturas = async (
  fechaDesde: string,
  fechaHasta: string
): Promise<FacturaResumen[]> => {
  const primera = await FacturaService.getPaginated(0, 1, "", {
    fechaDesde,
    fechaHasta
  });

  const total = primera.totalElements ?? 0;

  if (total === 0) {
    return [];
  }

  const completa = await FacturaService.getPaginated(
    0,
    Math.min(total, MAX_REGISTROS),
    "",
    { fechaDesde, fechaHasta }
  );

  return completa.content ?? [];
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
  async getResumen(fechaDesde: Date, fechaHasta: Date): Promise<DashboardResumen> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicioTendencia = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

    const desde = new Date(fechaDesde);
    desde.setHours(0, 0, 0, 0);

    const hasta = new Date(fechaHasta);
    hasta.setHours(23, 59, 59, 999);

    const rangoDentroDeTendencia = desde.getTime() >= inicioTendencia.getTime();

    const [facturasSeisMeses, productos, clientesPage, facturasPeriodoExterno] = await Promise.all([
      fetchTodasLasFacturas(formatFecha(inicioTendencia), formatFecha(hoy)),
      fetchTodosLosProductos(),
      PersonaService.getPaginated(0, 1, ""),
      rangoDentroDeTendencia
        ? Promise.resolve<FacturaResumen[] | null>(null)
        : fetchTodasLasFacturas(formatFecha(desde), formatFecha(hasta))
    ]);

    const facturasPeriodo = rangoDentroDeTendencia
      ? facturasSeisMeses.filter((f) => dentroDeRango(new Date(f.dFeEmiDE), desde, hasta))
      : facturasPeriodoExterno ?? [];

    const facturasPeriodoOrdenadas = [...facturasPeriodo].sort(
      (a, b) => new Date(b.dFeEmiDE).getTime() - new Date(a.dFeEmiDE).getTime()
    );

    const ventasPeriodo = facturasPeriodo.reduce(
      (acc, f) => acc + (Number(f.total) || 0),
      0
    );

    const productosActivos = productos.filter((p) => p.active).length;
    const productosInactivos = productos.length - productosActivos;

    const tendenciaVentas: { label: string; total: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);

      const total = facturasSeisMeses
        .filter((f) => {
          const fecha = new Date(f.dFeEmiDE);
          return (
            fecha.getFullYear() === mes.getFullYear() &&
            fecha.getMonth() === mes.getMonth()
          );
        })
        .reduce((acc, f) => acc + (Number(f.total) || 0), 0);

      tendenciaVentas.push({
        label: mes.toLocaleDateString("es-PY", { month: "short" }),
        total
      });
    }

    const facturacionSemanal: { label: string; cantidad: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() - i);

      const cantidad = facturasSeisMeses.filter((f) =>
        mismoDia(new Date(f.dFeEmiDE), dia)
      ).length;

      facturacionSemanal.push({
        label: dia.toLocaleDateString("es-PY", { weekday: "short" }),
        cantidad
      });
    }

    const facturasPendientes = facturasPeriodoOrdenadas
      .filter((f) => f.estado === "Pendiente")
      .slice(0, 4);

    return {
      ventasPeriodo,
      facturasEmitidasPeriodo: facturasPeriodo.length,
      productosActivos,
      productosInactivos,
      clientesActivos: clientesPage.totalElements ?? 0,
      tendenciaVentas,
      facturacionSemanal,
      facturasRecientes: facturasPeriodoOrdenadas.slice(0, 5),
      facturasPendientes
    };
  }
};
