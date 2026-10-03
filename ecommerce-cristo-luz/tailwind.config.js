/** @type {import('tailwindcss').Config} */

/**
 * Reads each color from a `--color-x: R G B` CSS variable so the palette can
 * be swapped at runtime (see src/context/TenantContext.tsx) while still
 * supporting Tailwind opacity modifiers like `bg-primary/20`.
 */
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

const colorTokens = [
  "background",
  "on-background",
  "surface",
  "on-surface",
  "surface-variant",
  "on-surface-variant",
  "surface-dim",
  "surface-bright",
  "surface-container-lowest",
  "surface-container-low",
  "surface-container",
  "surface-container-high",
  "surface-container-highest",
  "surface-tint",
  "inverse-surface",
  "inverse-on-surface",
  "primary",
  "on-primary",
  "primary-container",
  "on-primary-container",
  "primary-fixed",
  "primary-fixed-dim",
  "on-primary-fixed",
  "on-primary-fixed-variant",
  "inverse-primary",
  "secondary",
  "on-secondary",
  "secondary-container",
  "on-secondary-container",
  "secondary-fixed",
  "secondary-fixed-dim",
  "on-secondary-fixed",
  "on-secondary-fixed-variant",
  "tertiary",
  "on-tertiary",
  "tertiary-container",
  "on-tertiary-container",
  "tertiary-fixed",
  "tertiary-fixed-dim",
  "on-tertiary-fixed",
  "on-tertiary-fixed-variant",
  "error",
  "on-error",
  "error-container",
  "on-error-container",
  "outline",
  "outline-variant",
];

const colors = Object.fromEntries(
  colorTokens.map((token) => [token, withOpacity(`--color-${token}`)]),
);

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors,
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        xs: "8px",
        md: "24px",
        base: "4px",
        "margin-mobile": "16px",
        xl: "64px",
        gutter: "24px",
        lg: "40px",
        "margin-desktop": "80px",
        sm: "16px",
      },
      fontFamily: {
        "headline-lg": ["Hanken Grotesk"],
        "label-sm": ["Inter"],
        "headline-md": ["Hanken Grotesk"],
        "body-lg": ["Inter"],
        "headline-xl": ["Hanken Grotesk"],
        "body-sm": ["Inter"],
        "label-md": ["Inter"],
        "body-md": ["Inter"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};
