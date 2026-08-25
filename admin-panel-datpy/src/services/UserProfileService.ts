import api from "./api";

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  fotoUrl: string | null;
  activo: boolean;
  empresaId: string;
  empresaNombre: string;
  direccion: string | null;
  celular: string | null;
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  direccion: string;
  celular: string;
}

export const UserProfileService = {
  async getMe(): Promise<UserProfile> {
    const res = await api.get("/users/me");
    return res.data;
  },

  async actualizarPerfil(payload: ActualizarPerfilPayload): Promise<UserProfile> {
    const res = await api.put("/users/me", payload);
    return res.data;
  },

  async cambiarPassword(passwordActual: string, passwordNueva: string) {
    const res = await api.put("/users/me/password", { passwordActual, passwordNueva });
    return res.data;
  },

  async actualizarFoto(foto: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("foto", foto);

    const res = await api.post("/users/me/foto", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return res.data;
  }
};
