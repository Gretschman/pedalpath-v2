import { spacing, radius, elevation, typography, fontStack } from "./tokens";
import { lightTheme, darkTheme } from "./themes";
import fs from "node:fs";
import path from "node:path";

function cssVars(obj: Record<string, any>, prefix: string) {
  return Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k}: ${v};`)
    .join("\n");
}

function cssTypography() {
  return Object.entries(typography)
    .map(([k, v]) => `  --type-${k}-size: ${v.size};\n  --type-${k}-lh: ${v.lineHeight};\n  --type-${k}-w: ${v.weight};`)
    .join("\n");
}

const css = `:root {
  --font-stack: ${fontStack};

${cssVars(spacing as any, "space")}
${cssVars(radius as any, "radius")}
  --elevation-card: ${elevation.card};
  --elevation-raised: ${elevation.raised};

${cssTypography()}

  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

:root[data-theme="light"] {
${cssVars(lightTheme as any, "color")}
}
:root[data-theme="dark"] {
${cssVars(darkTheme as any, "color")}
}

/* Global iOS-feel defaults */
html, body {
  height: 100%;
  background: var(--color-bg);
  font-family: var(--font-stack);
  -webkit-text-size-adjust: 100%;
  text-rendering: optimizeLegibility;
}

* { box-sizing: border-box; }

a { color: inherit; text-decoration: none; }
`;

const out = path.join(process.cwd(), "styles.css");
fs.writeFileSync(out, css, "utf-8");
console.log("Wrote", out);
