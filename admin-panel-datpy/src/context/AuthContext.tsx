import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";
import api from "../services/api";
import { isTokenExpired } from "../utils/jwt";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (form: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (storedUser && accessToken && !isTokenExpired(accessToken)) {
      setUser(JSON.parse(storedUser));
    } else if (storedUser || accessToken) {
      localStorage.clear();
    }

    setLoading(false);

  }, []);

  const login = async (form: any) => {

    try {

      const res = await api.post("/auth/signin", form);

      const { accessToken, refreshToken, user } = res.data;

      if (!accessToken || !user) {
        throw new Error("Respuesta inválida del servidor");
      }

      // Guardar tokens
      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Guardar usuario
      localStorage.setItem("user", JSON.stringify(user));

      // Guardar empresaId
      if (user.empresaId) {
        localStorage.setItem("empresaId", user.empresaId);
      }

      setUser(user);

    } catch (error) {

      console.error("Error en login:", error);
      throw error;

    }

  };

  const logout = async () => {

    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout sin respuesta del backend");
    }

    localStorage.clear();
    setUser(null);
    window.location.href = "/login";

  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
