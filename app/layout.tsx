import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEX HONDURAS — Motor de Cálculo de Penas",
  description: "Código Penal de Honduras (Decreto 130-2017). Determine la pena con precisión técnica.",
};

export const viewport = { themeColor: "#1A2B4A" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
