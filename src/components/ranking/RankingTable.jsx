"use client";

import { useAuth } from "@/components/auth/AuthProvider";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RankingTable({ rows, profileNames }) {
  const { user } = useAuth();

  if (!rows || rows.length === 0) {
    return <div className="p-6 text-sm text-eco-emerald-700">Aun no hay puntajes para mostrar.</div>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-eco-emerald-50 text-xs uppercase tracking-wide text-eco-emerald-600">
        <tr>
          <th className="px-4 py-3">#</th>
          <th className="px-4 py-3">Jugador</th>
          <th className="px-4 py-3">Puntaje</th>
          <th className="px-4 py-3">Actualizado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const rawName = profileNames?.[row.user_id] || "";
          const isSelf = user && row.user_id === user.id;
          const fallbackSelf = isSelf && user?.email ? user.email.split("@")[0] : "";
          const displayName = rawName.trim() || fallbackSelf || `Jugador ${row.user_id?.slice(0, 6)}`;
          return (
            <tr
              key={`${row.user_id}-${row.updated_at}`}
              className={`border-t border-eco-emerald-100 ${
                isSelf ? "bg-eco-emerald-50/70" : "bg-white"
              }`}
            >
              <td className="px-4 py-3 font-semibold text-eco-emerald-900">{index + 1}</td>
              <td className="px-4 py-3 text-eco-emerald-900">{displayName}</td>
              <td className="px-4 py-3 font-semibold text-eco-emerald-900">{row.max_score}</td>
              <td className="px-4 py-3 text-eco-emerald-700">{formatDate(row.updated_at)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
