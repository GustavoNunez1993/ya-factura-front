import { useEffect, useState } from "react";
import { CajaAperturaCierreService } from "../services/CajaAperturaCierreService";
import { NRO_CAJA } from "../utils/caja";

/** Evento que se dispara al guardar los datos de la empresa, para refrescar lo que depende de ellos. */
export const EVENTO_EMPRESA_ACTUALIZADA = "empresa-actualizada";

/**
 * Si la empresa usa apertura y cierre de caja (Datos de la empresa → Control de caja). Mientras
 * no se sabe, o si la consulta falla, se asume que sí: así no se esconde nada por error.
 */
export function useUsaCaja(): boolean {
  const [usaCaja, setUsaCaja] = useState(true);

  useEffect(() => {
    let vigente = true;
    const consultar = () =>
      CajaAperturaCierreService.getEstado(NRO_CAJA)
        .then((estado) => {
          if (vigente) setUsaCaja(estado.modo !== "SIN_CAJA");
        })
        .catch(() => {
          if (vigente) setUsaCaja(true);
        });

    consultar();
    window.addEventListener(EVENTO_EMPRESA_ACTUALIZADA, consultar);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO_EMPRESA_ACTUALIZADA, consultar);
    };
  }, []);

  return usaCaja;
}
