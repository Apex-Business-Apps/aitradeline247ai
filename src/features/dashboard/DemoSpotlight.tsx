import React from "react";

export type DemoSpotlightProps = {
  /** bounding rect of the target element; null hides spotlight */
  rect: DOMRect | null;
  /** optional extra classes */
  className?: string;
  /** show/hide explicitly (defaults true when rect provided) */
  visible?: boolean;
};

export default function DemoSpotlight({ rect, className, visible }: DemoSpotlightProps) {
  if (!rect || visible === false) return null;
  
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    pointerEvents: "none",
  };
  
  return (
    <div
      style={style}
      className={`ring-4 ring-cyan-400/70 rounded-xl transition-all duration-300 ${className || ""}`}
      aria-hidden="true"
    />
  );
}