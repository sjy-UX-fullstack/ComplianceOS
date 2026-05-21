import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
}

const toneMap: Record<NonNullable<BadgeProps["tone"]>, { bg: string; fg: string }> = {
  neutral: { bg: "var(--color-bg-elevated)", fg: "var(--color-text-secondary)" },
  primary: { bg: "rgba(59, 130, 246, 0.15)", fg: "var(--color-primary-light)" },
  success: { bg: "rgba(16, 185, 129, 0.15)", fg: "var(--color-success)" },
  warning: { bg: "rgba(245, 158, 11, 0.15)", fg: "var(--color-warning)" },
  danger: { bg: "rgba(239, 68, 68, 0.15)", fg: "var(--color-danger)" },
};

export function Badge({ tone = "neutral", style, children, ...rest }: BadgeProps) {
  const t = toneMap[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "var(--radius-sm)",
        background: t.bg,
        color: t.fg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
