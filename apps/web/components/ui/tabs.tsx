"use client";

import * as React from "react";

interface TabsContextValue {
  active: string;
  setActive: (v: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ active: value, setActive: onChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: 4,
        borderBottom: "1px solid var(--color-border)",
        marginBottom: 16,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Tab({
  value,
  children,
  style,
  ...rest
}: { value: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("<Tab> must be used inside <Tabs>");
  const isActive = ctx.active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setActive(value)}
      style={{
        padding: "10px 16px",
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${isActive ? "var(--color-primary-light)" : "transparent"}`,
        color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
        cursor: "pointer",
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
        marginBottom: -1,
        transition: "all 0.15s ease",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("<TabPanel> must be used inside <Tabs>");
  if (ctx.active !== value) return null;
  return <div role="tabpanel">{children}</div>;
}
