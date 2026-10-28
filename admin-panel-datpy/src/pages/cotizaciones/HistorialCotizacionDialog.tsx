import { useEffect, useMemo, useState } from "react";
import type { ChartData, ChartOptions, Plugin, ScriptableContext, TooltipItem } from "chart.js";

import { Chart } from "primereact/chart";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { SelectButton } from "primereact/selectbutton";

import { useTheme } from "../../context/ThemeContext";
import { CotizacionService, type CotizacionHistorial } from "../../services/CotizacionService";

interface Props {
  moneda: { codigo: string; label: string } | null;
  onHide: () => void;
}

const RANGOS = [
  { label: "1 mes", value: 1 },
  { label: "3 meses", value: 3 },
  { label: "6 meses", value: 6 },
  { label: "1 año", value: 12 }
];

/*
 * Colores validados con el validador de paleta (contraste >= 3:1 contra la superficie del tema).
 * linea: #4361ee sobre #ffffff (lara-light) y #6b85f5 sobre #1f2937 (lara-dark, #4361ee daba 2,92:1).
 * sube/baja/igual: mismos significados que las flechas de la tabla.
 */
const COLORES = {
  light: {
    linea: "#4361ee", relleno: "rgba(67, 97, 238, 0.12)", superficie: "#ffffff",
    grilla: "#eef0f3", texto: "#6b7280", sube: "#16a34a", baja: "#dc2626", igual: "#0891b2"
  },
  dark: {
    linea: "#6b85f5", relleno: "rgba(107, 133, 245, 0.18)", superficie: "#1f2937",
    grilla: "#2d3748", texto: "#9ca3af", sube: "#22c55e", baja: "#f87171", igual: "#22d3ee"
  }
};

type Paleta = (typeof COLORES)["light"];

const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

const formatoGs = (valor: number) =>
  `Gs. ${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 4 }).format(valor)}`;

const formatoPorcentaje = (valor: number) =>
  `${new Intl.NumberFormat("es-PY", { maximumFractionDigits: 2 }).format(valor)}%`;

const formatoFecha = (fecha: Date) => new Intl.DateTimeFormat("es-PY").format(fecha);

const formatoFechaCorta = (fecha: Date) =>
  new Intl.DateTimeFormat("es-PY", { day: "2-digit", month: "2-digit" }).format(fecha);

const formatoFechaHora = (fecha: Date) =>
  new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(fecha);

interface Fila extends CotizacionHistorial {
  /** Día al que corresponde la cotización (eje del gráfico). */
  dia: Date;
  /** Cuándo se cargó. */
  cargadaEl: Date;
  /** Diferencia con la cotización anterior del período; null en la primera. */
  variacion: number | null;
}

const colorVariacion = (variacion: number | null, c: Paleta) =>
  variacion === null ? c.linea : variacion > 0 ? c.sube : variacion < 0 ? c.baja : c.igual;

/** Flecha coloreada + monto: el color va sólo en la flecha, el monto en el color de texto. */
function Variacion({ valor, anterior }: { valor: number | null; anterior?: number }) {
  if (valor === null) return <span className="text-color-secondary">—</span>;
  if (valor === 0) {
    return (
      <span>
        <span className="text-cyan-500 font-bold">=</span> Sin cambio
      </span>
    );
  }
  const subio = valor > 0;
  return (
    <span>
      <span className={subio ? "text-green-500" : "text-red-500"} aria-label={subio ? "Subió" : "Bajó"}>
        {subio ? "▲" : "▼"}
      </span>{" "}
      {formatoGs(Math.abs(valor))}
      {anterior ? (
        <span className="text-color-secondary"> ({formatoPorcentaje((valor / anterior) * 100)})</span>
      ) : null}
    </span>
  );
}

function Indicador({ titulo, children, detalle }: { titulo: string; children: React.ReactNode; detalle?: string }) {
  return (
    <div className="col-6 md:col-3">
      <div className="p-2 border-round surface-ground h-full">
        <div className="text-sm text-color-secondary">{titulo}</div>
        <div className="font-semibold mt-1" style={{ whiteSpace: "nowrap" }}>{children}</div>
        {detalle && <small className="text-color-secondary">{detalle}</small>}
      </div>
    </div>
  );
}

export default function HistorialCotizacionDialog({ moneda, onHide }: Props) {
  const { theme } = useTheme();
  const colores = COLORES[theme === "dark" ? "dark" : "light"];

  const [meses, setMeses] = useState(3);
  // Respuesta junto con la consulta que la pidió: "cargando" es que todavía no llegó la de la consulta actual.
  const [resultado, setResultado] = useState<{ clave: string; historial: CotizacionHistorial[]; error: boolean } | null>(
    null
  );
  const clave = moneda ? `${moneda.codigo}-${meses}` : "";
  const loading = moneda !== null && resultado?.clave !== clave;
  const actual = loading ? null : resultado;
  const error = actual?.error ? "No se pudo cargar el historial" : null;

  useEffect(() => {
    if (!moneda) return;
    const hasta = new Date();
    const desde = new Date();
    desde.setMonth(desde.getMonth() - meses);
    const consulta = `${moneda.codigo}-${meses}`;

    let vigente = true;
    CotizacionService.historial(moneda.codigo, aIso(desde), aIso(hasta))
      .then((data) => {
        if (vigente) setResultado({ clave: consulta, historial: data, error: false });
      })
      .catch(() => {
        if (vigente) setResultado({ clave: consulta, historial: [], error: true });
      });
    return () => {
      vigente = false;
    };
  }, [moneda, meses]);

  /** En orden cronológico (el back devuelve la más reciente primero). */
  const cronologico: Fila[] = useMemo(
    () =>
      [...(actual?.historial ?? [])].reverse().map((h, i, arr) => ({
        ...h,
        dia: new Date(`${h.fecha}T00:00:00`),
        cargadaEl: new Date(h.fechaHora),
        variacion: i === 0 ? null : h.valor - arr[i - 1].valor
      })),
    [actual]
  );
  const filas = useMemo(() => [...cronologico].reverse(), [cronologico]);

  const resumen = useMemo(() => {
    if (cronologico.length === 0) return null;
    const valores = cronologico.map((f) => f.valor);
    const primera = cronologico[0];
    const ultima = cronologico[cronologico.length - 1];
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    return {
      ultima,
      variacion: cronologico.length > 1 ? ultima.valor - primera.valor : null,
      primera,
      minimo,
      maximo,
      fechaMinimo: cronologico.find((f) => f.valor === minimo)!.dia,
      fechaMaximo: cronologico.find((f) => f.valor === maximo)!.dia
    };
  }, [cronologico]);

  const data: ChartData<"line", { x: number; y: number }[]> = useMemo(() => {
    const colorPunto = (ctx: ScriptableContext<"line">) =>
      colorVariacion(cronologico[ctx.dataIndex]?.variacion ?? null, colores);
    return {
      datasets: [
        {
          data: cronologico.map((f) => ({ x: f.dia.getTime(), y: f.valor })),
          borderColor: colores.linea,
          borderWidth: 2,
          tension: 0,
          fill: "start",
          backgroundColor: colores.relleno,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: colorPunto,
          pointHoverBackgroundColor: colorPunto,
          pointBorderColor: colores.superficie,
          pointHoverBorderColor: colores.superficie,
          pointBorderWidth: 2,
          pointHitRadius: 14
        }
      ]
    };
  }, [cronologico, colores]);

  // Etiqueta sólo el último valor (el vigente del período), arriba de su punto.
  const etiquetaUltimo: Plugin<"line"> = useMemo(
    () => ({
      id: "etiquetaUltimo",
      afterDatasetsDraw(chart) {
        const meta = chart.getDatasetMeta(0);
        const punto = meta.data[meta.data.length - 1];
        const ultima = cronologico[cronologico.length - 1];
        if (!punto || !ultima) return;
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.font = "600 12px sans-serif";
        ctx.fillStyle = colores.texto;
        const texto = formatoGs(ultima.valor);
        const ancho = ctx.measureText(texto).width;
        // Si no entra a la derecha del punto, se alinea a su izquierda.
        const derecha = punto.x + ancho / 2 <= chartArea.right;
        ctx.textAlign = derecha ? "center" : "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(texto, derecha ? punto.x : punto.x + 6, punto.y - 10);
        ctx.restore();
      }
    }),
    [cronologico, colores]
  );

  const options: ChartOptions<"line"> = useMemo(() => {
    const dias = cronologico.map((f) => f.dia.getTime());
    const pocosPuntos = dias.length > 0 && dias.length <= 8;
    return {
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { top: 24, right: 12 } },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (items) => (items[0] ? formatoFecha(new Date(items[0].parsed.x ?? 0)) : ""),
            label: (item: TooltipItem<"line">) => formatoGs(item.parsed.y ?? 0),
            afterLabel: (item: TooltipItem<"line">) => {
              const fila = cronologico[item.dataIndex];
              if (!fila) return "";
              const lineas: string[] = [];
              if (fila.variacion !== null && fila.variacion !== 0) {
                const anterior = fila.valor - fila.variacion;
                lineas.push(
                  `${fila.variacion > 0 ? "▲ Subió" : "▼ Bajó"} ${formatoGs(Math.abs(fila.variacion))} (${formatoPorcentaje((fila.variacion / anterior) * 100)})`
                );
              } else if (fila.variacion === 0) {
                lineas.push("= Sin cambio");
              }
              if (fila.usuario) lineas.push(`Cargó ${fila.usuario}`);
              return lineas;
            }
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          // Con pocas cotizaciones, una marca por cada fecha cargada; si no, se reparten.
          afterBuildTicks: pocosPuntos
            ? (escala) => {
                escala.ticks = dias.map((value) => ({ value }));
              }
            : undefined,
          min: dias.length === 1 ? dias[0] - 86_400_000 : undefined,
          max: dias.length === 1 ? dias[0] + 86_400_000 : undefined,
          offset: true,
          grid: { display: false },
          border: { color: colores.grilla },
          ticks: { color: colores.texto, maxTicksLimit: 8, callback: (v) => formatoFechaCorta(new Date(Number(v))) }
        },
        y: {
          grace: "15%",
          grid: { color: colores.grilla },
          border: { display: false },
          ticks: { color: colores.texto, maxTicksLimit: 5, callback: (v) => formatoGs(Number(v)) }
        }
      }
    };
  }, [colores, cronologico]);

  return (
    <Dialog
      header={moneda ? `Historial de cotización · ${moneda.label} (${moneda.codigo})` : ""}
      visible={moneda !== null}
      modal
      draggable={false}
      resizable={false}
      style={{ width: "860px", maxWidth: "95vw" }}
      onHide={onHide}
    >
      <div className="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <small className="text-color-secondary">Valor de 1 {moneda?.codigo} en guaraníes, una cotización por día.</small>
        <SelectButton value={meses} options={RANGOS} allowEmpty={false} onChange={(e) => setMeses(e.value)} />
      </div>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          {resumen && (
            <div className="grid mb-2">
              <Indicador titulo="Actual" detalle={`del ${formatoFecha(resumen.ultima.dia)}`}>
                {formatoGs(resumen.ultima.valor)}
              </Indicador>
              <Indicador titulo="Variación en el período" detalle={`desde el ${formatoFecha(resumen.primera.dia)}`}>
                <Variacion valor={resumen.variacion} anterior={resumen.primera.valor} />
              </Indicador>
              <Indicador titulo="Mínimo" detalle={`el ${formatoFecha(resumen.fechaMinimo)}`}>
                {formatoGs(resumen.minimo)}
              </Indicador>
              <Indicador titulo="Máximo" detalle={`el ${formatoFecha(resumen.fechaMaximo)}`}>
                {formatoGs(resumen.maximo)}
              </Indicador>
            </div>
          )}

          <div style={{ height: 240 }} className="mb-3">
            {!loading && filas.length === 0 ? (
              <div className="h-full flex align-items-center justify-content-center text-color-secondary">
                No hay cotizaciones en este período
              </div>
            ) : (
              <Chart type="line" data={data} options={options} plugins={[etiquetaUltimo]} style={{ height: "100%" }} />
            )}
          </div>

          <DataTable
            value={filas}
            loading={loading}
            size="small"
            stripedRows
            scrollable
            scrollHeight="220px"
            emptyMessage="No hay cotizaciones en este período"
          >
            <Column header="Fecha" body={(f: Fila) => formatoFecha(f.dia)} />
            <Column header="Valor" body={(f: Fila) => <span className="font-semibold">{formatoGs(f.valor)}</span>} />
            <Column
              header="Variación"
              body={(f: Fila) => (
                <Variacion valor={f.variacion} anterior={f.variacion === null ? undefined : f.valor - f.variacion} />
              )}
            />
            <Column
              header="Cargada"
              body={(f: Fila) =>
                f.usuario ? (
                  <span>
                    {f.usuario}
                    <br />
                    <small className="text-color-secondary">{formatoFechaHora(f.cargadaEl)}</small>
                  </span>
                ) : (
                  <span className="text-color-secondary">Registro inicial</span>
                )
              }
            />
          </DataTable>
        </>
      )}
    </Dialog>
  );
}
