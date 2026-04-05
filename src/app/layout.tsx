import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoURP — Educación en reciclaje",
  description: "Plataforma educativa sobre reciclaje y cuidado del medio ambiente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
