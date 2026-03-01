import * as React from "react";
import { Pressable } from "../primitives/Pressable";

export function ListCell(props: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  const { title, subtitle, trailing, onClick } = props;

  return (
    <Pressable onClick={onClick}>
      <div
        style={{
          minHeight: "56px",
          padding: "var(--space-12) var(--space-16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-12)",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--elevation-card)",
          border: "1px solid color-mix(in srgb, var(--color-separator) 35%, transparent)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontSize: "var(--type-headline-size)", lineHeight: "var(--type-headline-lh)", fontWeight: 700, color: "var(--color-text)" }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: "var(--type-footnote-size)", lineHeight: "var(--type-footnote-lh)", color: "var(--color-subtext)" }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)" }}>
          {trailing}
          <span style={{ color: "var(--color-subtext)", fontSize: "18px", lineHeight: "18px" }}>›</span>
        </div>
      </div>
    </Pressable>
  );
}
