import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { UserProfile } from "../types/user";

const STORAGE_KEY = "user-profile";

interface UserContextValue {
  user: UserProfile | null;
  register: (profile: UserProfile) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

function readInitialUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(readInitialUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function register(profile: UserProfile) {
    setUser(profile);
  }

  return <UserContext.Provider value={{ user, register }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de un UserProvider");
  }
  return context;
}
