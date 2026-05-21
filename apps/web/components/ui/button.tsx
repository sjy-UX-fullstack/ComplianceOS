import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "var(--color-bg-elevated)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--color-danger)",
    color: "#fff",
    border: "none",
  },
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, React.CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: 13 },
  md: { padding: "8px 16px", fontSize: 14 },
  lg: { padding: "12px 24px", fontSize: 16 },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, style, children, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: "var(--radius-md)",
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          opacity: disabled || loading ? 0.6 : 1,
          textDecoration: "none",
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        {...rest}
      >
        {loading ? "…" : children}
      </button>
    );
  },
);
