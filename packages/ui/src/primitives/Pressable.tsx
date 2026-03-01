import * as React from "react";
import { easeIOS, duration, prefersReducedMotion } from "@pedalpath/motion";

type Props = React.PropsWithChildren<{
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  role?: React.AriaRole;
  ariaLabel?: string;
}>;

/**
 * Pressable: iOS-like pressed feedback (subtle scale + opacity).
 * Ensures 44px min target when used for list rows/buttons.
 */
export function Pressable({ children, onClick, className, style, role, ariaLabel }: Props) {
  const [pressed, setPressed] = React.useState(false);
  const reduced = typeof window !== "undefined" ? prefersReducedMotion() : false;

  const base: React.CSSProperties = {
    cursor: onClick ? "pointer" : "default",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition: reduced ? "none" : `transform ${duration.fast}ms ${easeIOS}, opacity ${duration.fast}ms ${easeIOS}`,
    transform: pressed && !reduced ? "scale(0.985)" : "scale(1)",
    opacity: pressed ? 0.92 : 1,
    ...style,
  };

  return (
    <div
      role={role ?? (onClick ? "button" : undefined)}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : -1}
      className={className}
      style={base}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      {children}
    </div>
  );
}
