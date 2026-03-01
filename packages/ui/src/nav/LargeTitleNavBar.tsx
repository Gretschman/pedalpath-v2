import * as React from "react";

export function LargeTitleNavBar(props: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const { title, subtitle, right } = props;
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "saturate(180%) blur(18px)",
        WebkitBackdropFilter: "saturate(180%) blur(18px)",
        background: "color-mix(in srgb, var(--color-bg) 78%, transparent)",
        borderBottom: "1px solid var(--color-separator)",
      }}
    >
      <div style={{ padding: "calc(var(--space-12) + var(--safe-top)) var(--space-16) var(--space-12) var(--space-16)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-12)" }}>
          <div>
            <div
              style={{
                fontSize: "var(--type-largeTitle-size)",
                lineHeight: "var(--type-largeTitle-lh)",
                fontWeight: "var(--type-largeTitle-w)" as any,
                color: "var(--color-text)",
                letterSpacing: "-0.4px",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div style={{ marginTop: "var(--space-8)", fontSize: "var(--type-subheadline-size)", lineHeight: "var(--type-subheadline-lh)", color: "var(--color-subtext)" }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ? <div style={{ paddingTop: "var(--space-8)" }}>{right}</div> : null}
        </div>
      </div>
    </header>
  );
}
