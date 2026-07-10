export const colors = {
  bg: "#121212",
  surface: "#1e1e1e",
  surfaceAlt: "#2a2a2a",
  nav: "#1a1a1a",
  border: "#333",
  overlay: "rgba(0, 0, 0, 0.85)",
  overlaySoft: "rgba(0, 0, 0, 0.6)",
  overlayBadge: "rgba(0, 0, 0, 0.85)",

  text: "#fff",
  textInverse: "#000",
  textMuted: "#888",
  placeholder: "#666",

  primary: "#6b21a8",
  primaryBorder: "#d8b4fe",
  accent: "#4ade80",
  warning: "#eab308",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.1)",
} as const;

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
  xxl: 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 15,
  pill: 999,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    display: 32,
  },
} as const;
