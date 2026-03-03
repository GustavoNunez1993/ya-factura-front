import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect
} from "react";
import api from "../services/api";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (form: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = async (form: any) => {
    const res = await api.post("/api/auth/signin", form);

    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}

    localStorage.clear();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);