import { useAuth } from "../context/AuthContext";

export function useRole() {
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isUser = user?.role === "USER";

  return { isAdmin, isUser };
}