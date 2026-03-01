export const easeIOS = "cubic-bezier(0.2, 0.8, 0.2, 1)";
export const duration = {
  fast: 180,
  normal: 220,
  slow: 280,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}
