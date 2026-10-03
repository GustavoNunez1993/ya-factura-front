import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TenantConfig, ThemeTokens } from "../types/tenant";
import { getDefaultTenant } from "../data/tenants";

const STORAGE_KEY = "tenant-config";

interface TenantContextValue {
  tenant: TenantConfig;
  updateTenant: (partial: Partial<Omit<TenantConfig, "theme">> & { theme?: Partial<ThemeTokens> }) => void;
  resetTenant: () => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

function readInitialTenant(): TenantConfig {
  const defaults = getDefaultTenant();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const stored = JSON.parse(raw) as Partial<TenantConfig>;
    return {
      ...defaults,
      ...stored,
      theme: { ...defaults.theme, ...stored.theme },
    };
  } catch {
    return defaults;
  }
}

function hexToRgbTriplet(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return "0 0 0";
  const [, r, g, b] = match;
  return `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`;
}

const THEME_TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  primary: "--color-primary",
  onPrimary: "--color-on-primary",
  primaryContainer: "--color-primary-container",
  secondary: "--color-secondary",
  secondaryContainer: "--color-secondary-container",
  onSecondaryContainer: "--color-on-secondary-container",
  background: "--color-background",
  surface: "--color-surface",
  error: "--color-error",
};

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(readInitialTenant);

  useEffect(() => {
    const root = document.documentElement;
    for (const [token, cssVar] of Object.entries(THEME_TOKEN_TO_CSS_VAR)) {
      root.style.setProperty(cssVar, hexToRgbTriplet(tenant.theme[token as keyof ThemeTokens]));
    }
  }, [tenant.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenant));
  }, [tenant]);

  useEffect(() => {
    document.title = `${tenant.storeName} - E-Comerces`;
  }, [tenant.storeName]);

  function updateTenant(
    partial: Partial<Omit<TenantConfig, "theme">> & { theme?: Partial<ThemeTokens> },
  ) {
    setTenant((current) => ({
      ...current,
      ...partial,
      theme: { ...current.theme, ...partial.theme },
    }));
  }

  function resetTenant() {
    setTenant(getDefaultTenant());
  }

  const value = useMemo<TenantContextValue>(
    () => ({ tenant, updateTenant, resetTenant }),
    [tenant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant debe usarse dentro de un TenantProvider");
  }
  return context;
}
