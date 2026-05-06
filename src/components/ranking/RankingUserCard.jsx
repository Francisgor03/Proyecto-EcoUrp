"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { normUserId } from "@/lib/normUserId";

export default function RankingUserCard({ rows, compact = false }) {
  const { user, loading } = useAuth();

  const { userBest, userRank } = useMemo(() => {
    if (!user || !Array.isArray(rows) || rows.length === 0) {
      return { userBest: null, userRank: null };
    }

    const uid = normUserId(user.id);
    const index = rows.findIndex((row) => normUserId(row.user_id) === uid);
    if (index < 0) {
      return { userBest: null, userRank: null };
    }

    const best = typeof rows[index]?.max_score === "number" ? rows[index].max_score : null;
    return { userBest: best, userRank: index + 1 };
  }, [rows, user]);

  const bestLabel = loading ? "…" : typeof userBest === "number" ? userBest : "-";
  const rankLabel = loading
    ? "…"
    : typeof userRank === "number"
      ? `#${userRank}`
      : "Sin ranking";

  if (compact) {
    return (
      <div className="flex w-full min-w-[min(100%,18rem)] shrink-0 flex-col justify-center gap-3 rounded-2xl border border-eco-emerald-200 bg-white px-5 py-4 shadow-sm sm:w-auto sm:min-w-[17.5rem] sm:px-6 sm:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-eco-emerald-500 sm:text-xs">
          Tu posicion
        </p>
        {!user ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm text-eco-emerald-700">Inicia sesion para ver tu puesto.</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-eco-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-eco-emerald-700"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-1">
            <div>
              <p className="text-xs font-medium text-eco-emerald-600">Ranking</p>
              <p className="text-2xl font-bold leading-none text-eco-emerald-950 sm:text-3xl">{rankLabel}</p>
            </div>
            <div className="h-10 w-px shrink-0 bg-eco-emerald-200 sm:h-11" aria-hidden />
            <div>
              <p className="text-xs font-medium text-eco-emerald-600">Mejor puntaje</p>
              <p className="text-2xl font-bold leading-none text-eco-emerald-950 sm:text-3xl">{bestLabel}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-6 shadow-lg shadow-eco-emerald-900/5">
      <h2 className="text-lg font-semibold text-eco-emerald-900">Tu posicion</h2>
      <p className="mt-1 text-sm text-eco-emerald-700">Tu mejor resultado y ranking actual.</p>

      {!user ? (
        <div className="mt-6 rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 p-4">
          <p className="text-sm font-semibold text-eco-emerald-900">
            Inicia sesion para guardar tu puntaje en el ranking.
          </p>
          <p className="mt-2 text-xs text-eco-emerald-700">
            Si aun no tienes cuenta, puedes crearla en segundos.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-eco-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-eco-emerald-700"
          >
            Iniciar sesion o registrarme
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">Mejor puntaje</p>
            <p className="mt-2 text-2xl font-bold text-eco-emerald-900">{bestLabel}</p>
          </div>
          <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">Posicion</p>
            <p className="mt-2 text-2xl font-bold text-eco-emerald-900">{rankLabel}</p>
            <p className="mt-2 text-xs text-eco-emerald-700">
              {typeof userRank === "number"
                ? "Sigue jugando para mejorar tu posicion."
                : "Juega una partida para aparecer en el ranking."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
