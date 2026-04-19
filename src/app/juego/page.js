"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GameContainer from "@/components/game/GameContainer";
import { useAuth } from "@/components/auth/AuthProvider";

export default function JuegoPage() {
  const router = useRouter();
  const { session, loading, isConfigured, signOut } = useAuth();

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/juego");
    }
  }, [loading, session, isConfigured, router]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Configuración pendiente</p>
          <p className="mt-2 text-amber-800/90">
            Crea un archivo <code className="rounded bg-amber-100 px-1">.env.local</code> con las
            variables de Supabase y reinicia el servidor de desarrollo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl border border-eco-emerald-200 bg-white/90 p-10 text-center shadow-sm">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-eco-emerald-200 border-t-eco-emerald-600" />
          <p className="text-sm font-medium text-eco-emerald-800">Verificando tu sesión…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-eco-emerald-900 sm:text-3xl">Juego del tacho</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-eco-emerald-300 bg-white px-4 py-2 text-sm font-medium text-eco-emerald-800 shadow-sm hover:bg-eco-emerald-50"
            >
              ← Inicio
            </Link>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
              className="rounded-full border border-eco-emerald-300 bg-eco-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-eco-emerald-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
        <GameContainer />
        <p className="mt-4 text-center text-xs text-eco-emerald-600 sm:text-left">
          PC: teclas 1–4 cambian el tacho; flechas o A/D mueven. Móvil: botones inferiores.
        </p>
        <p className="mt-2 text-center text-xs text-eco-emerald-600 sm:text-left">
          El modo se elige dentro del juego desde el menu de inicio.
        </p>
      </div>
    </div>
  );
}
