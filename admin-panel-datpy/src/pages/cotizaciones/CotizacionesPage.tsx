import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { Tag } from "primereact/tag";

import {
  CotizacionService,
  type Cotizacion,
} from "../../services/CotizacionService";
import HistorialCotizacionDialog from "./HistorialCotizacionDialog";
import { usePermisos } from "../../hooks/usePermisos";

const MONEDAS_EDITABLES = [
  { codigo: "USD", label: "Dólar estadounidense", simbolo: "US$" },
  { codigo: "BRL", label: "Real brasileño", simbolo: "R$" },
  { codigo: "EUR", label: "Euro", simbolo: "€" },
];

/** A partir de cuántos días sin actualizar se avisa que la cotización puede estar vieja. */
const DIAS_DESACTUALIZADA = 1;

const aFecha = (fecha: string) => new Date(`${fecha}T00:00:00`);

const formatearFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-PY").format(aFecha(fecha));

const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

const hoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const diasDesde = (fecha: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((hoy.getTime() - aFecha(fecha).getTime()) / 86_400_000);
};

const textoAntiguedad = (dias: number) => {
  if (dias <= 0) return "Actualizada hoy";
  if (dias === 1) return "Hace 1 día";
  return `Hace ${dias} días`;
};

export default function CotizacionesPage() {
  // Acciones según el rol (el back valida igual cada una).
  const { puede } = usePermisos();
  const [loading, setLoading] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [valores, setValores] = useState<Record<string, number | null>>({});
  // Fecha a la que corresponde la cotización que se va a cargar; sin elegir, hoy.
  const [fechas, setFechas] = useState<Record<string, Date | null>>({});
  const [guardandoCodigo, setGuardandoCodigo] = useState<string | null>(null);
  const [historialDe, setHistorialDe] = useState<{
    codigo: string;
    label: string;
  } | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await CotizacionService.getAll();
      setCotizaciones(data);
      setValores(
        Object.fromEntries(data.map((c) => [c.codigoMoneda, c.valor])),
      );
    } catch (error) {
      console.error("Error cargando cotizaciones", error);
      Swal.fire("Error", "No se pudieron cargar las cotizaciones", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (codigo: string) => {
    const valor = valores[codigo];
    if (!valor || valor <= 0) {
      Swal.fire("Atención", "Ingrese un valor mayor a cero", "warning");
      return;
    }

    const fecha = aIso(fechas[codigo] ?? hoy());

    try {
      setGuardandoCodigo(codigo);
      const vigente = await CotizacionService.actualizar(codigo, valor, fecha);
      await cargar();
      setFechas((prev) => ({ ...prev, [codigo]: null }));
      if (vigente.fecha !== fecha) {
        // Fecha anterior a la vigente: queda en el historial, pero facturación sigue usando la vigente.
        Swal.fire(
          "Agregada al historial",
          `Se registró la cotización de ${codigo} del ${formatearFecha(fecha)}. La vigente sigue siendo la del ${formatearFecha(vigente.fecha ?? fecha)}.`,
          "info",
        );
        return;
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Cotización de ${codigo} del ${formatearFecha(fecha)} guardada`,
        showConfirmButton: false,
        timer: 1800,
      });
    } catch (error) {
      console.error("Error guardando cotización", error);
      Swal.fire("Error", "No se pudo guardar la cotización", "error");
    } finally {
      setGuardandoCodigo(null);
    }
  };

  const hayDesactualizadas = MONEDAS_EDITABLES.some(({ codigo }) => {
    const fecha = cotizaciones.find((c) => c.codigoMoneda === codigo)?.fecha;
    return !fecha || diasDesde(fecha) >= DIAS_DESACTUALIZADA;
  });

  return (
    <div className="card">
      <div className="mb-3">
        <h2 className="m-0">Cotizaciones</h2>
        <small className="text-color-secondary">
          Tipo de cambio de esta empresa, que se usa al facturar en una moneda distinta del
          guaraní
        </small>
      </div>

      {!loading && hayDesactualizadas && (
        <Message
          className="w-full justify-content-start mb-3"
          severity="warn"
          text="Hay cotizaciones sin cargar o que no se actualizaron hoy. Se cargan a mano: no se sincronizan con ninguna fuente externa."
        />
      )}

      <div className="grid">
        {MONEDAS_EDITABLES.map(({ codigo, label, simbolo }) => {
          const actual = cotizaciones.find((c) => c.codigoMoneda === codigo);
          const valor = valores[codigo] ?? null;
          const cambiado = valor !== (actual?.valor ?? null);
          const dias = actual?.fecha ? diasDesde(actual.fecha) : null;
          const desactualizada = dias === null || dias >= DIAS_DESACTUALIZADA;

          return (
            <div key={codigo} className="col-12 md:col-6 xl:col-4">
              <div
                className="h-full flex flex-column gap-3 p-3 surface-card border-1 surface-border"
                style={{
                  borderRadius: 10,
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="flex align-items-center gap-3">
                  <div
                    className="flex align-items-center justify-content-center border-round font-bold"
                    style={{
                      width: 44,
                      height: 44,
                      background: "var(--highlight-bg)",
                      color: "var(--highlight-text-color)",
                      fontSize: 15,
                    }}
                  >
                    {simbolo}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{label}</div>
                    <small className="text-color-secondary">{codigo}</small>
                  </div>
                  {loading ? null : dias === null ? (
                    <Tag value="Sin cargar" severity="danger" />
                  ) : (
                    <Tag
                      value={textoAntiguedad(dias)}
                      severity={desactualizada ? "warning" : "success"}
                    />
                  )}
                </div>

                <div className="flex gap-2 align-items-end">
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <label className="text-sm text-color-secondary">
                      1 {codigo} equivale a
                    </label>
                    <InputNumber
                      className="w-full mt-1"
                      inputClassName="w-full text-xl font-semibold"
                      value={valor}
                      onValueChange={(e) =>
                        setValores((prev) => ({
                          ...prev,
                          [codigo]: e.value ?? null,
                        }))
                      }
                      locale="es-PY"
                      prefix="Gs. "
                      minFractionDigits={0}
                      maxFractionDigits={4}
                      placeholder="Sin cotización cargada"
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardar(codigo);
                      }}
                    />
                  </div>
                  <div style={{ width: 150 }}>
                    <label className="text-sm text-color-secondary">
                      Fecha
                    </label>
                    <Calendar
                      className="w-full mt-1"
                      inputClassName="w-full"
                      value={fechas[codigo] ?? hoy()}
                      onChange={(e) =>
                        setFechas((prev) => ({
                          ...prev,
                          [codigo]: (e.value as Date | null) ?? null,
                        }))
                      }
                      maxDate={hoy()}
                      dateFormat="dd/mm/yy"
                      showIcon
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex align-items-center justify-content-between gap-2 mt-auto">
                  <small className="text-color-secondary">
                    {actual?.fecha
                      ? `Vigente del ${formatearFecha(actual.fecha)}`
                      : "Nunca se cargó"}
                  </small>
                  <div className="flex gap-2">
                    <Button
                      label="Historial"
                      icon="pi pi-chart-line"
                      size="small"
                      text
                      disabled={loading}
                      onClick={() => setHistorialDe({ codigo, label })}
                    />
                    {puede("COTIZACIONES", "EDITAR") && (
                    <Button
                      label="Guardar"
                      icon="pi pi-check"
                      size="small"
                      outlined={!cambiado && !desactualizada}
                      loading={guardandoCodigo === codigo}
                      disabled={loading || !valor}
                      onClick={() => guardar(codigo)}
                    />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <HistorialCotizacionDialog
        moneda={historialDe}
        onHide={() => setHistorialDe(null)}
      />
    </div>
  );
}
