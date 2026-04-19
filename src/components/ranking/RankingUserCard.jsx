"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RankingUserCard({ rows }) {
  const { user, loading } = useAuth();

  const { userBest, userRank } = useMemo(() => {
    if (!user || !Array.isArray(rows) || rows.length === 0) {
      return { userBest: null, userRank: null };
    }

    const index = rows.findIndex((row) => row.user_id === user.id);
    if (index < 0) {
      return { userBest: null, userRank: null };
    }

    const best = typeof rows[index]?.max_score === "number" ? rows[index].max_score : null;
    return { userBest: best, userRank: index + 1 };
  }, [rows, user]);

  const bestLabel = loading ? "…" : typeof userBest === "number" ? userBest : "-";
  const rankLabel = loading
    ? "Cargando"
    : typeof userRank === "number"
      ? `#${userRank}`
      : "Sin ranking";

  return (
    <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-6 shadow-lg shadow-eco-emerald-900/5">
      <h2 className="text-lg font-semibold text-eco-emerald-900">Tu posicion</h2>
      <p className="mt-1 text-sm text-eco-emerald-700">
        Tu mejor resultado y ranking actual.
      </p>

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
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Mejor puntaje
            </p>
            <p className="mt-2 text-2xl font-bold text-eco-emerald-900">{bestLabel}</p>
          </div>
          <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Posicion
            </p>
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
