import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

import { CotizacionService, type Cotizacion } from "../../services/CotizacionService";

const MONEDAS_EDITABLES = [
  { codigo: "USD", label: "Dólares" },
  { codigo: "BRL", label: "Reales" },
  { codigo: "EUR", label: "Euros" }
];

const formatearFecha = (fecha: string | null) => {
  if (!fecha) return "Sin cargar";
  return new Intl.DateTimeFormat("es-PY").format(new Date(`${fecha}T00:00:00`));
};

export default function CotizacionesPage() {
  const [loading, setLoading] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [valores, setValores] = useState<Record<string, number | null>>({});
  const [guardandoCodigo, setGuardandoCodigo] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      const data = await CotizacionService.getAll();
      setCotizaciones(data);
      setValores(Object.fromEntries(data.map((c) => [c.codigoMoneda, c.valor])));
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

    try {
      setGuardandoCodigo(codigo);
      await CotizacionService.actualizar(codigo, valor);
      await cargar();
      Swal.fire("Guardado", `Cotización de ${codigo} actualizada`, "success");
    } catch (error) {
      console.error("Error guardando cotización", error);
      Swal.fire("Error", "No se pudo guardar la cotización", "error");
    } finally {
      setGuardandoCodigo(null);
    }
  };

  return (
    <div className="p-4">
      <h2>Cotizaciones</h2>
      <p className="text-500">
        Tipo de cambio usado al facturar en una moneda distinta de guaraníes. Se carga a mano acá
        — no se sincroniza con ninguna fuente externa, así que hay que mantenerla actualizada.
      </p>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="flex flex-column gap-3" style={{ maxWidth: 480 }}>
          {MONEDAS_EDITABLES.map(({ codigo, label }) => {
            const actual = cotizaciones.find((c) => c.codigoMoneda === codigo);
            return (
              <div
                key={codigo}
                className="flex align-items-end gap-3 p-3 border-1 border-round surface-border"
              >
                <div className="flex-1">
                  <label>
                    {label} ({codigo})
                  </label>
                  <InputNumber
                    className="w-full mt-1"
                    value={valores[codigo] ?? null}
                    onValueChange={(e) =>
                      setValores((prev) => ({ ...prev, [codigo]: e.value ?? null }))
                    }
                    minFractionDigits={2}
                    maxFractionDigits={4}
                    placeholder="Sin cotización cargada"
                  />
                  <small className="text-500">
                    Última actualización: {formatearFecha(actual?.fecha ?? null)}
                  </small>
                </div>
                <Button
                  label="Guardar"
                  icon="pi pi-check"
                  loading={guardandoCodigo === codigo}
                  onClick={() => guardar(codigo)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
