import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import RankingUserCard from "@/components/ranking/RankingUserCard";
import RankingTable from "@/components/ranking/RankingTable";

export const dynamic = "force-dynamic";

const MAX_ROWS = 50;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MODE_LABELS = {
  easy: "Facil",
  normal: "Normal",
  hard: "Dificil",
  timed: "Contrarreloj",
  zen: "Zen",
};
type ModeKey = keyof typeof MODE_LABELS;

export default async function RankingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const params = await Promise.resolve(searchParams);
  const range = params?.range === "weekly" ? "weekly" : "all";
  const mode: ModeKey =
    typeof params?.mode === "string" && params.mode in MODE_LABELS
      ? (params.mode as ModeKey)
      : "normal";
  const since = range === "weekly" ? new Date(Date.now() - ONE_WEEK_MS) : null;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("ecourp_tacho_scores_mode")
    .select("user_id,max_score,updated_at,game_mode")
    .eq("game_mode", mode)
    .order("max_score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(MAX_ROWS);

  if (since) {
    query = query.gte("updated_at", since.toISOString());
  }

  const { data: rows, error } = await query;
  const rankingRows = rows ?? [];

  if (error) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-white p-6 text-sm text-red-700 shadow-sm">
          <p className="font-semibold">No se pudo cargar el ranking.</p>
          <p className="mt-2 text-red-600/90">{error.message}</p>
          <p className="mt-3 text-xs text-red-600/80">
            Verifica las politicas de RLS para permitir lectura del leaderboard.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  let profileMap = new Map();

  if (rankingRows.length > 0) {
    const userIds = rankingRows.map((row) => row.user_id).filter(Boolean);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", userIds);

      if (profiles && profiles.length > 0) {
        profileMap = new Map(
          profiles.map((profile) => [profile.id, profile.display_name || ""])
        );
      }
    }
  }

  const profileNames = Object.fromEntries(profileMap.entries());

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-emerald-100/70 via-eco-emerald-50 to-eco-emerald-50 px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Ranking EcoURP
            </p>
            <h1 className="text-2xl font-bold text-eco-emerald-950 sm:text-3xl">
              Tabla de posiciones
            </h1>
            <p className="mt-2 text-sm text-eco-emerald-700">
              Top {MAX_ROWS} jugadores en modo {MODE_LABELS[mode].toLowerCase()}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-eco-emerald-300 bg-white px-4 py-2 text-sm font-medium text-eco-emerald-800 shadow-sm hover:bg-eco-emerald-50"
            >
              ← Inicio
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(MODE_LABELS).map(([value, label]) => (
            <Link
              key={value}
              href={`/ranking?mode=${value}${range === "weekly" ? "&range=weekly" : ""}`}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                mode === value
                  ? "border-eco-emerald-500 bg-eco-emerald-600 text-white"
                  : "border-eco-emerald-200 bg-white text-eco-emerald-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/ranking?mode=${mode}`}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              range === "all"
                ? "border-eco-emerald-500 bg-eco-emerald-600 text-white"
                : "border-eco-emerald-200 bg-white text-eco-emerald-700"
            }`}
          >
            Todo el tiempo
          </Link>
          <Link
            href={`/ranking?mode=${mode}&range=weekly`}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              range === "weekly"
                ? "border-eco-emerald-500 bg-eco-emerald-600 text-white"
                : "border-eco-emerald-200 bg-white text-eco-emerald-700"
            }`}
          >
            Ultimos 7 dias
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-6 shadow-lg shadow-eco-emerald-900/5">
            <h2 className="text-lg font-semibold text-eco-emerald-900">Ranking</h2>
            <p className="mt-1 text-sm text-eco-emerald-700">
              Puntajes ordenados por record.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-eco-emerald-100">
              <RankingTable rows={rankingRows} profileNames={profileNames} />
            </div>
          </section>

          <RankingUserCard rows={rankingRows} />
        </div>
      </div>
    </div>
  );
}
