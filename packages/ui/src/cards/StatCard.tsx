import * as React from "react";

export function StatCard(props: { label: string; value: string | number; icon?: React.ReactNode }) {
  const { label, value } = props;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--elevation-card)",
        padding: "var(--space-16)",
        border: "1px solid color-mix(in srgb, var(--color-separator) 35%, transparent)",
      }}
    >
      <div style={{ fontSize: "var(--type-footnote-size)", lineHeight: "var(--type-footnote-lh)", color: "var(--color-subtext)" }}>
        {label}
      </div>
      <div style={{ marginTop: "var(--space-8)", fontSize: "28px", lineHeight: "34px", fontWeight: 700, color: "var(--color-text)" }}>
        {value}
      </div>
    </div>
  );
}
