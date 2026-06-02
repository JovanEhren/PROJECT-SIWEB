import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SHIPIN GO",
  description: "Platform logistics modern untuk pengiriman bisnis dan operasional admin SHIPIN GO."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
