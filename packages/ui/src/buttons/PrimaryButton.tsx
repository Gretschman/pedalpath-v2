import * as React from "react";
import { Pressable } from "../primitives/Pressable";

export function PrimaryButton(props: { label: string; onClick: () => void }) {
  const { label, onClick } = props;
  return (
    <Pressable onClick={onClick} ariaLabel={label}>
      <div
        style={{
          minHeight: "44px",
          padding: "0 var(--space-16)",
          borderRadius: "var(--radius-lg)",
          background: "var(--color-tint)",
          color: "#fff",
          fontSize: "var(--type-headline-size)",
          lineHeight: "var(--type-headline-lh)",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </Pressable>
  );
}
