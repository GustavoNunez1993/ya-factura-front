import Swal from "sweetalert2";
import { CajaAperturaCierreService } from "../services/CajaAperturaCierreService";

/** Caja desde la que se emite. Hoy el sistema opera con una sola caja por empresa. */
export const NRO_CAJA = 1;

/**
 * Regla de negocio: no se emite ningún comprobante sin una apertura de caja activa.
 * Devuelve true si hay caja abierta; si no, avisa y ofrece ir a la apertura.
 * (El back también lo valida: esto es para cortar antes y guiar al usuario.)
 */
export async function verificarCajaAbierta(textoCancelar = "Cancelar"): Promise<boolean> {
  try {
    await CajaAperturaCierreService.getCajaAbierta(NRO_CAJA);
    return true;
  } catch {
    const r = await Swal.fire({
      icon: "warning",
      title: "Sin apertura de caja",
      text: "No hay una apertura de caja activa. Realice la apertura de caja antes de emitir comprobantes.",
      confirmButtonText: "Ir a apertura de caja",
      showCancelButton: true,
      cancelButtonText: textoCancelar
    });
    if (r.isConfirmed) {
      window.location.href = "/apertura-caja";
    }
    return false;
  }
}
