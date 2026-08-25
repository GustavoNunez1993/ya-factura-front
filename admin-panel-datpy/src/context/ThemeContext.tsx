import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import lightThemeHref from "primereact/resources/themes/lara-light-blue/theme.css?url";
import darkThemeHref from "primereact/resources/themes/lara-dark-blue/theme.css?url";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

const THEME_LINK_ID = "prime-theme";
const STORAGE_KEY = "theme";

const getThemeHref = (theme: Theme) => (theme === "dark" ? darkThemeHref : lightThemeHref);

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.id = THEME_LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }

    link.href = getThemeHref(theme);

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
