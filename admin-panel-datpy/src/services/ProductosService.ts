import api from "./api";

const buildFormData = (data: any, imagenes: File[] = []) => {
  const formData = new FormData();

  formData.append(
    "producto",
    new Blob([JSON.stringify(data)], { type: "application/json" })
  );

  imagenes.forEach((file) => {
    formData.append("imagenes", file);
  });

  return formData;
};

export const ProductosService = {
  async getPaginated(page: number, size: number, search: string = "") {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get("/productos", {
      params: {
        empresaId,
        page,
        size,
        busqueda: search
      }
    });

    return res.data;
  },

  async getById(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.get(`/productos/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async create(data: any, imagenes: File[] = []) {
    const empresaId = localStorage.getItem("empresaId");

    const formData = buildFormData(
      {
        ...data,
        empresaId
      },
      imagenes
    );

    const res = await api.post("/productos", formData, {
      params: { empresaId },
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return res.data;
  },

  async update(id: string, data: any, imagenes: File[] = []) {
    const empresaId = localStorage.getItem("empresaId");

    const formData = buildFormData(
      {
        ...data,
        empresaId
      },
      imagenes
    );

    const res = await api.put(`/productos/${id}`, formData, {
      params: { empresaId },
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    return res.data;
  },

  async remove(id: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(`/productos/${id}`, {
      params: { empresaId }
    });

    return res.data;
  },

  async addImages(productoId: string, imagenes: File[] = []) {
    const empresaId = localStorage.getItem("empresaId");

    const formData = new FormData();

    imagenes.forEach((file) => {
      formData.append("imagenes", file);
    });

    const res = await api.post(
      `/productos/${productoId}/imagenes`,
      formData,
      {
        params: { empresaId },
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    return res.data;
  },

  async removeImage(productoId: string, imagenId: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.delete(
      `/productos/${productoId}/imagenes/${imagenId}`,
      {
        params: { empresaId }
      }
    );

    return res.data;
  },

  async setMainImage(productoId: string, imagenId: string) {
    const empresaId = localStorage.getItem("empresaId");

    const res = await api.patch(
      `/productos/${productoId}/imagenes/${imagenId}/principal`,
      {},
      {
        params: { empresaId }
      }
    );

    return res.data;
  }
};