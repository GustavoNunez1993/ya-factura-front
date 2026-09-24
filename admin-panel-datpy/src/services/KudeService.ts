import axios from "axios";

/**
 * Cliente del microservicio `kude-renderer` (representación gráfica del DE en PDF).
 * El front lo llama **directo**, sin pasar por el back: es un servicio stateless que
 * recibe el rDE y devuelve el PDF.
 *
 * Configurar la URL con `VITE_KUDE_BASE_URL` (por defecto http://localhost:8090).
 * kude-renderer debe permitir el origen del panel vía su env `CORS_ORIGIN`.
 */
const KUDE_BASE_URL = import.meta.env.VITE_KUDE_BASE_URL || "http://localhost:8090";

const kude = axios.create({ baseURL: KUDE_BASE_URL });

export const KudeService = {
  /**
   * Genera el KuDE a partir del rDE (string XML). Devuelve un Blob `application/pdf`.
   * @param formato "a4" (por defecto) o "ticket" 80 mm.
   * @param personalizado usa la plantilla del emisor si existe (empresa.kudePersonalizado).
   */
  async render(
    xml: string,
    formato: "a4" | "ticket" = "a4",
    personalizado = false
  ): Promise<Blob> {
    const res = await kude.post(
      "/kude",
      { tipo: "view", formato, personalizado, xml },
      { responseType: "blob" }
    );
    return res.data as Blob;
  },
};
