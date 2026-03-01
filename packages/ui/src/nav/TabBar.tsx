import * as React from "react";
import { Pressable } from "../primitives/Pressable";

export type TabItem = { key: string; label: string; icon?: React.ReactNode };

export function TabBar(props: {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  const { items, activeKey, onChange } = props;
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        borderTop: "1px solid var(--color-separator)",
        background: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
        backdropFilter: "saturate(180%) blur(18px)",
        WebkitBackdropFilter: "saturate(180%) blur(18px)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, padding: "var(--space-8) var(--space-12)" }}>
        {items.map((t) => {
          const active = t.key === activeKey;
          return (
            <Pressable key={t.key} onClick={() => onChange(t.key)} ariaLabel={t.label}>
              <div style={{ minHeight: "44px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                <div style={{ fontSize: "12px", color: active ? "var(--color-tint)" : "var(--color-subtext)", fontWeight: active ? 600 : 400 }}>
                  {t.label}
                </div>
              </div>
            </Pressable>
          );
        })}
      </div>
    </nav>
  );
}
