import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import HomeHeader from "@/components/navigation/HomeHeader";
import ThemeScript from "@/components/theme/ThemeScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeScript />
        <ThemeProvider>
          <AuthProvider>
            <LoginToast />
            <AchievementToast />
            <HomeHeader />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
