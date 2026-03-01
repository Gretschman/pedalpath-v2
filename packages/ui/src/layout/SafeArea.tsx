import * as React from "react";

export function SafeArea({ children }: React.PropsWithChildren) {
  return (
    <div
      style={{
        paddingTop: "var(--safe-top)",
        paddingRight: "var(--safe-right)",
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        minHeight: "100vh",
        background: "var(--color-bg)",
      }}
    >
      {children}
    </div>
  );
}
