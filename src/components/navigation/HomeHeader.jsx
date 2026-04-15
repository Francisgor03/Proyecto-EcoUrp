"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import UserMenu from "@/components/navigation/UserMenu";

export default function HomeHeader() {
  const { session, loading, isConfigured } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-eco-emerald-200/80 bg-eco-emerald-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-xl px-1 py-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-emerald-600 text-lg font-bold text-white shadow-sm">
            E
          </span>
          <span className="text-xl font-bold tracking-tight text-eco-emerald-900">EcoURP</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="#reciclaje"
            className="rounded-full px-4 py-2 text-sm font-medium text-eco-emerald-800 transition hover:bg-eco-emerald-100"
          >
            Reciclaje
          </a>
          <a
            href="#separacion"
            className="rounded-full px-4 py-2 text-sm font-medium text-eco-emerald-800 transition hover:bg-eco-emerald-100"
          >
            Separacion
          </a>
          <Link
            href="/juego"
            className="rounded-full px-4 py-2 text-sm font-medium text-eco-emerald-800 transition hover:bg-eco-emerald-100"
          >
            Jugar
          </Link>
          {!loading && isConfigured && session ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-eco-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700"
            >
              Iniciar sesion
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
