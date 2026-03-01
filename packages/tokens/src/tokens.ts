export const spacing = {
  0: "0px",
  4: "4px",
  8: "8px",
  12: "12px",
  16: "16px",
  20: "20px",
  24: "24px",
  28: "28px",
  32: "32px",
} as const;

export const radius = {
  sm: "10px",
  md: "12px",
  lg: "16px",
  pill: "9999px",
} as const;

// Subtle iOS-like elevation: avoid heavy Material shadows.
export const elevation = {
  card: "0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
  raised: "0 2px 4px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)",
} as const;

export const typography = {
  largeTitle: { size: "34px", lineHeight: "41px", weight: 700 },
  title3: { size: "20px", lineHeight: "25px", weight: 700 },
  headline: { size: "17px", lineHeight: "22px", weight: 600 },
  body: { size: "17px", lineHeight: "22px", weight: 400 },
  subheadline: { size: "15px", lineHeight: "20px", weight: 400 },
  footnote: { size: "13px", lineHeight: "18px", weight: 400 },
  caption2: { size: "11px", lineHeight: "13px", weight: 400 },
} as const;

// iOS-like font stack for web
export const fontStack = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, system-ui, sans-serif`;
