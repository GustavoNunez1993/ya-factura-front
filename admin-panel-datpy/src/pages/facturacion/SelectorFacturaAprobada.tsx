import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { AutoComplete } from "primereact/autocomplete";
import type { AutoCompleteCompleteEvent } from "primereact/autocomplete";

import { FacturaService } from "../../services/FacturaService";

export interface DetalleFacturaAprobada {
  id: string;
  codigo?: string;
  descripcion?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

/** Factura aprobada por SIFEN sobre la que se emite una NC o ND. */
export interface FacturaAprobada {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  saldo: number;
  esContado: boolean;
  detalles: DetalleFacturaAprobada[];
}

interface OpcionFactura {
  id: string;
  etiqueta: string;
}

interface Props {
  value: FacturaAprobada | null;
  onChange: (factura: FacturaAprobada | null) => void;
  /** Factura a precargar (p. ej. al venir desde la fila del listado de facturas). */
  facturaIdInicial?: string | null;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(value || 0);

async function cargarFactura(id: string): Promise<FacturaAprobada> {
  const f = await FacturaService.getById(id);
  const estado = String(f.estadoSifen ?? "").toUpperCase();
  if ((f.tipoDocumentoElectronico ?? 1) !== 1 || !(estado === "APROBADO" || estado === "APROBADO_CON_OBSERVACION")) {
    throw new Error("Sólo se puede elegir una factura aprobada por SIFEN.");
  }
  return {
    id: f.id,
    numero: `${f.dEst}-${f.dPunExp}-${f.dNumDoc}`,
    cliente: f.dNomRec ?? "-",
    total: Number(f.total ?? 0),
    saldo: Number(f.saldo ?? 0),
    esContado: (f.condicionOperacionId ?? 1) === 1,
    detalles: (f.detalles ?? []).map((d: Record<string, unknown>) => ({
      id: String(d.id),
      codigo: d.codigo as string | undefined,
      descripcion: d.descripcion as string | undefined,
      cantidad: Number(d.cantidad ?? 0),
      precioUnitario: Number(d.precioUnitario ?? 0),
      total: Number(d.total ?? 0)
    }))
  };
}

/** Buscador de facturas aprobadas por SIFEN (la búsqueda la resuelve el back). */
export default function SelectorFacturaAprobada({ value, onChange, facturaIdInicial }: Props) {
  const [texto, setTexto] = useState<OpcionFactura | string | null>(null);
  const [sugerencias, setSugerencias] = useState<OpcionFactura[]>([]);

  useEffect(() => {
    if (!facturaIdInicial) return;
    cargarFactura(facturaIdInicial)
      .then((f) => {
        onChange(f);
        setTexto({ id: f.id, etiqueta: `${f.numero} · ${f.cliente}` });
      })
      .catch((e: unknown) => Swal.fire("Atención", e instanceof Error ? e.message : "No se pudo cargar la factura", "info"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facturaIdInicial]);

  const buscar = async (e: AutoCompleteCompleteEvent) => {
    try {
      const res = await FacturaService.getPaginated(0, 20, e.query, { tipoDocumento: 1, soloAprobadas: true });
      setSugerencias(
        (res?.content ?? []).map((f: { id: string; dEst: string; dPunExp: string; dNumDoc: string; clienteRazonSocial: string | null; total: number }) => ({
          id: f.id,
          etiqueta: `${f.dEst}-${f.dPunExp}-${f.dNumDoc} · ${f.clienteRazonSocial ?? "-"} · ${formatMoney(Number(f.total))}`
        }))
      );
    } catch {
      setSugerencias([]);
    }
  };

  const seleccionar = async (opcion: OpcionFactura | string | null) => {
    setTexto(opcion);
    if (!opcion || typeof opcion === "string") {
      if (!opcion) onChange(null);
      return;
    }
    try {
      onChange(await cargarFactura(opcion.id));
    } catch (e: unknown) {
      onChange(null);
      Swal.fire("Atención", e instanceof Error ? e.message : "No se pudo cargar la factura", "info");
    }
  };

  return (
    <div>
      <AutoComplete
        className="w-full"
        inputClassName="w-full"
        value={texto}
        suggestions={sugerencias}
        completeMethod={buscar}
        field="etiqueta"
        placeholder="Buscar factura aprobada por número o cliente"
        forceSelection
        dropdown
        onChange={(e) => seleccionar(e.value as OpcionFactura | string | null)}
      />
      {value && (
        <small className="text-color-secondary block mt-1">
          {value.cliente} · Total {formatMoney(value.total)} · {value.esContado ? "Contado" : `Crédito, saldo ${formatMoney(value.saldo)}`}
        </small>
      )}
    </div>
  );
}
