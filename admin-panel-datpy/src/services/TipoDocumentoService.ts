import api from "./api";

const BASE_URL = "/tipos-documento";

export const TipoDocumentoService = {
  async getAll() {
    const res = await api.get(BASE_URL);
    return res.data ?? [];
  }
};
