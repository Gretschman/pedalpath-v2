import * as React from "react";

type Variant = "info" | "success" | "neutral";

export function StatusPill(props: { label: string; variant: Variant }) {
  const { label, variant } = props;
  const map = {
    info: { bg: "var(--color-infoBg)", text: "var(--color-infoText)" },
    success: { bg: "var(--color-successBg)", text: "var(--color-successText)" },
    neutral: { bg: "color-mix(in srgb, var(--color-separator) 18%, transparent)", text: "var(--color-subtext)" },
  } as const;
  const c = map[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 10px",
        borderRadius: "var(--radius-pill)",
        background: c.bg,
        color: c.text,
        fontSize: "var(--type-footnote-size)",
        lineHeight: "var(--type-footnote-lh)",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
