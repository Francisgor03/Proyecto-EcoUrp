import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import LoginToast from "@/components/ui/LoginToast";
import AchievementToast from "@/components/ui/AchievementToast";

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
      <body className="min-h-screen font-sans">
        <AuthProvider>
          <LoginToast />
          <AchievementToast />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
