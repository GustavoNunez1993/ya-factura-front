import Swal from "sweetalert2";
import { CajaAperturaCierreService } from "../services/CajaAperturaCierreService";

/** Caja desde la que se emite. Hoy el sistema opera con una sola caja por empresa. */
export const NRO_CAJA = 1;

/**
 * Antes de emitir: según el control de caja de la empresa (Datos de la empresa) hace falta una
 * caja abierta hoy, una caja abierta de cualquier fecha, o ninguna. Devuelve true si se puede
 * emitir; si no, explica por qué y ofrece ir a la apertura o al cierre de caja.
 * (El back también lo valida: esto es para cortar antes y guiar al usuario.)
 */
export async function verificarCajaAbierta(textoCancelar = "Cancelar"): Promise<boolean> {
  let motivo = "No se pudo verificar la caja. Intente nuevamente.";
  let accion: "APERTURA" | "CIERRE" | null = null;
  try {
    const estado = await CajaAperturaCierreService.getEstado(NRO_CAJA);
    if (estado.puedeEmitir) return true;
    motivo = estado.motivo ?? motivo;
    accion = estado.accion;
  } catch {
    // Sin respuesta del back: se avisa igual y no se deja seguir.
  }

  const aCierre = accion === "CIERRE";
  const r = await Swal.fire({
    icon: "warning",
    title: aCierre ? "Caja de otro día" : "Sin apertura de caja",
    text: motivo,
    confirmButtonText: aCierre ? "Ir a cierre de caja" : "Ir a apertura de caja",
    showCancelButton: true,
    cancelButtonText: textoCancelar
  });
  if (r.isConfirmed) {
    window.location.href = aCierre ? "/cierre-caja" : "/apertura-caja";
  }
  return false;
}
