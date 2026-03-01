import * as React from "react";
import { easeIOS, duration, prefersReducedMotion } from "@pedalpath/motion";
import { Pressable } from "../primitives/Pressable";

export function Sheet(props: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { open, title, onClose, children } = props;
  const reduced = typeof window !== "undefined" ? prefersReducedMotion() : false;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "var(--safe-left) var(--safe-right) var(--safe-bottom) var(--safe-left)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "var(--color-surface)",
          borderTopLeftRadius: "18px",
          borderTopRightRadius: "18px",
          boxShadow: "var(--elevation-raised)",
          transform: reduced ? "none" : "translateY(0)",
          transition: reduced ? "none" : `transform ${duration.normal}ms ${easeIOS}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "10px 0 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "42px", height: "5px", borderRadius: "9999px", background: "color-mix(in srgb, var(--color-separator) 40%, transparent)" }} />
        </div>
        <div style={{ padding: "var(--space-12) var(--space-16) var(--space-16) var(--space-16)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-12)" }}>
            <div style={{ fontSize: "var(--type-title3-size)", lineHeight: "var(--type-title3-lh)", fontWeight: 800, color: "var(--color-text)" }}>
              {title ?? "Sheet"}
            </div>
            <Pressable onClick={onClose} ariaLabel="Close">
              <div style={{ minHeight: "44px", minWidth: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-tint)", fontWeight: 700 }}>
                Done
              </div>
            </Pressable>
          </div>
          <div style={{ marginTop: "var(--space-12)" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
