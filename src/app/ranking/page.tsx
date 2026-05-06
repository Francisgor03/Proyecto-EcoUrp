import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ACHIEVEMENTS } from "@/lib/achievementsCatalog";
import { normUserId } from "@/lib/normUserId";
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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
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
      <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200/70 bg-card p-6 text-sm text-rose-600 shadow-sm">
          <p className="font-semibold">No se pudo cargar el ranking.</p>
          <p className="mt-2 text-rose-500/90">{error.message}</p>
          <p className="mt-3 text-xs text-rose-500/80">
            Verifica las politicas de RLS para permitir lectura del leaderboard.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-rose-200/70 bg-card px-4 py-2 text-xs font-semibold text-rose-600"
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

  // Logros por jugador. Requiere en Supabase la politica "Lectura publica logros desbloqueados ranking"
  // (ver docs/supabase_schema.sql); si solo existe "Lectura propia logros", solo veras tus filas.
  let achievementsMap: Record<string, string[]> = {};
  const rankedUserIds = rankingRows.map((row) => row.user_id).filter(Boolean);
  if (rankedUserIds.length > 0) {
    const { data: achRows, error: achError } = await supabase
      .from("ecourp_user_achievements")
      .select("user_id,achievement_id")
      .in("user_id", rankedUserIds);

    if (achError && process.env.NODE_ENV === "development") {
      console.warn("[ranking] ecourp_user_achievements:", achError.message);
    }

    if (achRows?.length) {
      const map: Record<string, string[]> = {};
      for (const row of achRows) {
        if (!row.user_id || !row.achievement_id) continue;
        const uid = normUserId(row.user_id);
        if (!map[uid]) map[uid] = [];
        map[uid].push(String(row.achievement_id).trim());
      }
      achievementsMap = map;
    }
  }

  if (user?.id) {
    const viewerId = normUserId(user.id);
    if (!achievementsMap[viewerId]?.length) {
      const { data: mine } = await supabase
        .from("ecourp_user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      const ids =
        mine
          ?.map((r) => String(r.achievement_id).trim())
          .filter((id): id is string => Boolean(id)) ?? [];
      if (ids.length) {
        achievementsMap = { ...achievementsMap, [viewerId]: ids };
      }
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="border-b border-border pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Ranking EcoURP
              </p>
              <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                Tabla de posiciones
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Top {MAX_ROWS} jugadores en modo {MODE_LABELS[mode].toLowerCase()}.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-raised/50 p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1 space-y-5">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Modo de juego
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(MODE_LABELS).map(([value, label]) => (
                      <Link
                        key={value}
                        href={`/ranking?mode=${value}${range === "weekly" ? "&range=weekly" : ""}`}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold sm:text-sm ${
                          mode === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground shadow-sm"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Periodo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/ranking?mode=${mode}`}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold sm:text-sm ${
                        range === "all"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground shadow-sm"
                      }`}
                    >
                      Todo el tiempo
                    </Link>
                    <Link
                      href={`/ranking?mode=${mode}&range=weekly`}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold sm:text-sm ${
                        range === "weekly"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground shadow-sm"
                      }`}
                    >
                      Ultimos 7 dias
                    </Link>
                  </div>
                </div>
              </div>
              <RankingUserCard rows={rankingRows} compact />
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground">Clasificacion</h2>
            <p className="mt-1 text-sm text-muted-foreground">Puntajes ordenados por record.</p>
            <div className="mt-4 rounded-2xl border border-border bg-card">
              <RankingTable
                rows={rankingRows}
                profileNames={profileNames}
                achievementsMap={achievementsMap}
                achievements={ACHIEVEMENTS}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
