export interface CountryDialCode {
  name: string;
  iso2: string;
  dialCode: string;
}

export const countries: CountryDialCode[] = [
  { name: "Paraguay", iso2: "PY", dialCode: "+595" },
  { name: "Argentina", iso2: "AR", dialCode: "+54" },
  { name: "Brasil", iso2: "BR", dialCode: "+55" },
  { name: "Bolivia", iso2: "BO", dialCode: "+591" },
  { name: "Uruguay", iso2: "UY", dialCode: "+598" },
  { name: "Chile", iso2: "CL", dialCode: "+56" },
  { name: "Perú", iso2: "PE", dialCode: "+51" },
  { name: "Colombia", iso2: "CO", dialCode: "+57" },
  { name: "Ecuador", iso2: "EC", dialCode: "+593" },
  { name: "Venezuela", iso2: "VE", dialCode: "+58" },
  { name: "México", iso2: "MX", dialCode: "+52" },
  { name: "Estados Unidos", iso2: "US", dialCode: "+1" },
  { name: "Canadá", iso2: "CA", dialCode: "+1" },
  { name: "Panamá", iso2: "PA", dialCode: "+507" },
  { name: "Costa Rica", iso2: "CR", dialCode: "+506" },
  { name: "Cuba", iso2: "CU", dialCode: "+53" },
  { name: "República Dominicana", iso2: "DO", dialCode: "+1" },
  { name: "Guatemala", iso2: "GT", dialCode: "+502" },
  { name: "Honduras", iso2: "HN", dialCode: "+504" },
  { name: "El Salvador", iso2: "SV", dialCode: "+503" },
  { name: "Nicaragua", iso2: "NI", dialCode: "+505" },
  { name: "Puerto Rico", iso2: "PR", dialCode: "+1" },
  { name: "España", iso2: "ES", dialCode: "+34" },
  { name: "Portugal", iso2: "PT", dialCode: "+351" },
  { name: "Francia", iso2: "FR", dialCode: "+33" },
  { name: "Italia", iso2: "IT", dialCode: "+39" },
  { name: "Alemania", iso2: "DE", dialCode: "+49" },
  { name: "Reino Unido", iso2: "GB", dialCode: "+44" },
  { name: "China", iso2: "CN", dialCode: "+86" },
  { name: "Japón", iso2: "JP", dialCode: "+81" },
  { name: "Corea del Sur", iso2: "KR", dialCode: "+82" },
  { name: "India", iso2: "IN", dialCode: "+91" },
  { name: "Australia", iso2: "AU", dialCode: "+61" }
];

export const flagEmoji = (iso2: string): string =>
  String.fromCodePoint(
    ...iso2
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0))
  );

export const defaultCountry = countries[0];

export const parsePhoneNumber = (
  value?: string | null
): { country: CountryDialCode; numero: string } => {
  const trimmed = (value ?? "").trim();

  if (!trimmed) {
    return { country: defaultCountry, numero: "" };
  }

  const match = [...countries]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((c) => trimmed.startsWith(c.dialCode));

  if (match) {
    return { country: match, numero: trimmed.slice(match.dialCode.length).trim() };
  }

  return { country: defaultCountry, numero: trimmed };
};
