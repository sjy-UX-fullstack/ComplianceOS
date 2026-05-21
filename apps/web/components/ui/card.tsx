import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  accent?: "primary" | "success" | "warning" | "danger" | null;
}

export function Card({ elevated, accent, style, children, ...rest }: CardProps) {
  const accentColor =
    accent === "primary" ? "var(--color-primary)"
    : accent === "success" ? "var(--color-success)"
    : accent === "warning" ? "var(--color-warning)"
    : accent === "danger" ? "var(--color-danger)"
    : null;
  return (
    <div
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-lg)",
        boxShadow: elevated ? "var(--shadow-md)" : "var(--shadow-sm)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: "var(--spacing-md)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, style, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: "var(--color-text)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, style, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 14,
        color: "var(--color-text-secondary)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </p>
  );
}

export function CardBody({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ ...style }} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        marginTop: "var(--spacing-md)",
        paddingTop: "var(--spacing-md)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
