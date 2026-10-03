export interface ThemeTokens {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  background: string;
  surface: string;
  error: string;
}

export interface TenantConfig {
  id: string;
  storeName: string;
  logoUrl: string;
  heroImageUrl: string;
  theme: ThemeTokens;
  address: string;
  contactPhone: string;
  contactEmail: string;
}
