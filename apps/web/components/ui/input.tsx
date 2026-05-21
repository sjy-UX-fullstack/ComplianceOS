import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ style, ...rest }, ref) {
    return <input ref={ref} style={{ ...fieldStyle, ...style }} {...rest} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ style, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        style={{ ...fieldStyle, minHeight: 80, resize: "vertical", ...style }}
        {...rest}
      />
    );
  },
);

export function Label({
  children,
  required,
  style,
  ...rest
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--color-text)",
        marginBottom: 6,
        ...style,
      }}
      {...rest}
    >
      {children}
      {required ? <span style={{ color: "var(--color-danger)" }}> *</span> : null}
    </label>
  );
}

export function FieldGroup({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", marginBottom: 16, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
