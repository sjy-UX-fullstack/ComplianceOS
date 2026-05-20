import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ComplianceOS — India DPDP Compliance Platform",
  description:
    "The operating system for DPDP Act 2023 compliance. Consent management, DSR portal, breach wizard, vendor risk, and more — built for Indian businesses.",
  keywords: [
    "DPDP",
    "compliance",
    "India",
    "data protection",
    "consent management",
    "privacy",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
