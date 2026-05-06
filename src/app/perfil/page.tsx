"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { ACHIEVEMENTS } from "@/lib/achievementsCatalog";
import AvatarSelector from "@/components/profile/AvatarSelector";
import {
  DEFAULT_AVATAR_ID,
  getAvatarById,
  getNormalizedModes,
  type UserStats,
} from "@/config/avatars";

type GameMode = "easy" | "normal" | "hard" | "timed" | "zen";

type SessionRow = {
  score: number | null;
  game_mode: string | null;
  duration_ms: number | null;
  created_at: string | null;
};

type ProfileRow = {
  display_name: string | null;
  avatar_id: string | null;
};

type ModeHistoryRow = {
  game_mode: string | null;
};

type ProfileStatsRow = {
  sessions_count: number | null;
  best_score: number | null;
  avg_score: number | null;
  last_played_at: string | null;
};

type AuthShape = {
  session: unknown | null;
  user: {
    id: string;
    email?: string | null;
    created_at?: string | null;
  } | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<unknown>;
};

const MODE_LABELS: Record<GameMode, string> = {
  easy: "Facil",
  normal: "Normal",
  hard: "Dificil",
  timed: "Contrarreloj",
  zen: "Zen",
};

const MODE_BADGE_STYLES: Record<GameMode, string> = {
  easy: "border-border bg-eco-emerald-100 text-eco-emerald-900",
  normal: "border-border bg-eco-emerald-200 text-eco-emerald-900",
  hard: "border-border bg-eco-emerald-300 text-eco-emerald-900",
  timed: "border-border bg-eco-lime-200 text-eco-emerald-900",
  zen: "border-border bg-eco-lime-100 text-eco-emerald-900",
};

const ACHIEVEMENT_REQUIREMENTS: Record<string, string> = {
  first_session: "1 partida jugada",
  five_sessions: "5 partidas jugadas",
  normal_50: "3 partidas en un dia",
  score_100: "Superar 100 puntos",
  modes_3: "Jugar todos los modos",
};

function normalizeMode(value: string | null | undefined): GameMode {
  if (value === "easy" || value === "normal" || value === "hard" || value === "timed" || value === "zen") {
    return value;
  }
  return "normal";
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDayMonth(value: string | null | undefined): { day: string; month: string } {
  if (!value) return { day: "--", month: "---" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "--", month: "---" };

  return {
    day: date.toLocaleDateString("es-PE", { day: "2-digit" }),
    month: date.toLocaleDateString("es-PE", { month: "short" }).replace(".", "").toUpperCase(),
  };
}

function formatDuration(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 6H5a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 6h3a2 2 0 0 1-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 11v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 19h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 15h4v4h-4z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BarsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6" y="11" width="3" height="6" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="11" y="8" width="3" height="9" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16" y="5" width="3" height="12" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M19 5c-7 0-11 3-11 8a5 5 0 0 0 5 5c5 0 8-4 8-11V5h-2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 16c2-2 4-4 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 14h2M13 14h2M9 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="m5 12 4 4 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2l-5.6 3 1.1-6.2-4.5-4.4 6.2-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SproutAchievementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M12 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 13c0-2.8-2-5-5-5 0 2.8 2 5 5 5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function FireAchievementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M13 4c1.7 2.4 1.4 4.6-.6 6.6 2.9-1 4.7 1.3 4.7 4 0 3.1-2.4 5.4-5.1 5.4-2.9 0-5-2.2-5-5.2 0-2.7 1.5-4.7 3.6-6.3.3 1.3.8 2 1.6 2.4.8-2 .9-4.3.8-5.9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CentennialAchievementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="m12 3 2.6 5.3 5.8.9-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M9.3 12.8h5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.2 10.9h3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.2 14.7h3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CompassAchievementIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 15 2-6 6-2-2 6-6 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function AchievementIcon({ id, className }: { id: string; className?: string }) {
  if (id === "first_session") return <SproutAchievementIcon className={className} />;
  if (id === "five_sessions") return <LeafIcon className={className} />;
  if (id === "normal_50") return <FireAchievementIcon className={className} />;
  if (id === "score_100") return <CentennialAchievementIcon className={className} />;
  if (id === "modes_3") return <CompassAchievementIcon className={className} />;
  return <StarIcon className={className} />;
}

export default function PerfilPage() {
  const router = useRouter();
  const { session, user, loading, isConfigured, signOut } = useAuth() as AuthShape;

  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [currentAvatarId, setCurrentAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<ProfileStatsRow | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionRow[]>([]);
  const [allModesPlayed, setAllModesPlayed] = useState<string[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const saveResetTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/perfil");
    }
  }, [loading, isConfigured, session, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    const activeUser = user;
    const client = supabase;

    let isMounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setStatusMessage("");

      const [profileResult, scoreResult, statsResult, sessionsResult, modesResult, achievementsResult] = await Promise.all([
        client.from("profiles").select("display_name,avatar_id").eq("id", activeUser.id).maybeSingle(),
        client.from("ecourp_tacho_scores").select("max_score").eq("user_id", activeUser.id).maybeSingle(),
        client
          .from("ecourp_tacho_profile_stats")
          .select("sessions_count,best_score,avg_score,last_played_at")
          .eq("user_id", activeUser.id)
          .maybeSingle(),
        client
          .from("ecourp_tacho_sessions")
          .select("score,game_mode,duration_ms,created_at")
          .eq("user_id", activeUser.id)
          .order("created_at", { ascending: false })
          .limit(100),
        client.from("ecourp_tacho_sessions").select("game_mode").eq("user_id", activeUser.id),
        client
          .from("ecourp_user_achievements")
          .select("achievement_id")
          .eq("user_id", activeUser.id),
      ]);

      if (!isMounted) return;

      const profileData = (profileResult.data as ProfileRow | null) ?? null;
      const safeName = profileData?.display_name?.trim() ?? "";
      const safeAvatarId = getAvatarById(profileData?.avatar_id ?? DEFAULT_AVATAR_ID).id;
      const statsData = (statsResult.data as ProfileStatsRow | null) ?? null;
      const scoreData = scoreResult.data?.max_score ?? 0;
      const sessionsData = (sessionsResult.data as SessionRow[] | null) ?? [];
      const modesData = (modesResult.data as ModeHistoryRow[] | null) ?? [];
      const modesFromHistory = modesData
        .map((row) => row.game_mode)
        .filter((mode): mode is string => typeof mode === "string");
      const modesFromRecent = sessionsData
        .map((row) => row.game_mode)
        .filter((mode): mode is string => typeof mode === "string");
      const mergedModes = getNormalizedModes([...modesFromHistory, ...modesFromRecent]);
      const achievementsData =
        ((achievementsResult.data as Array<{ achievement_id: string | null }> | null) ?? [])
          .map((row) => row.achievement_id)
          .filter((id): id is string => Boolean(id));

      setDisplayName(safeName);
      setDraftName(safeName);
      setCurrentAvatarId(safeAvatarId);
      setScore(statsData?.best_score ?? scoreData ?? 0);
      setStats(statsData);
      setRecentSessions(sessionsData);
      setAllModesPlayed(mergedModes);
      setUnlockedAchievements(achievementsData);
      setProfileLoading(false);
      setProfileLoaded(true);
    }

    loadProfile().catch(() => {
      if (!isMounted) return;
      setProfileLoading(false);
      setStatusMessage("No se pudo cargar tu perfil.");
      setCurrentAvatarId(DEFAULT_AVATAR_ID);
      setProfileLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (saveResetTimer.current) {
        window.clearTimeout(saveResetTimer.current);
      }
    };
  }, []);

  const profileName = useMemo(() => {
    if (displayName.trim()) return displayName.trim();
    if (user?.email) return user.email.split("@")[0] || "EcoURP";
    return "EcoURP";
  }, [displayName, user]);

  const activeAvatar = useMemo(() => getAvatarById(currentAvatarId), [currentAvatarId]);

  const avatarStats = useMemo<UserStats>(
    () => ({
      totalGames: Math.max(0, stats?.sessions_count ?? recentSessions.length ?? 0),
      maxScore: Math.max(0, score),
      modesPlayed: allModesPlayed,
    }),
    [allModesPlayed, recentSessions.length, score, stats?.sessions_count]
  );

  const createdAt = useMemo(() => {
    const value = user?.created_at;
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user]);

  const unlockedSet = useMemo(() => new Set(unlockedAchievements), [unlockedAchievements]);

  const favoriteMode = useMemo(() => {
    if (!recentSessions.length) {
      return {
        key: "normal" as GameMode,
        label: "Sin datos",
      };
    }

    const counts = new Map<GameMode, number>();
    recentSessions.forEach((row) => {
      const mode = normalizeMode(row.game_mode);
      counts.set(mode, (counts.get(mode) ?? 0) + 1);
    });

    let topMode: GameMode = "normal";
    let topCount = -1;

    counts.forEach((count, mode) => {
      if (count > topCount) {
        topCount = count;
        topMode = mode;
      }
    });

    return {
      key: topMode,
      label: MODE_LABELS[topMode],
    };
  }, [recentSessions]);

  const bestScore = profileLoading ? null : score;
  const avgScore = typeof stats?.avg_score === "number" ? stats.avg_score : null;
  const sessionsCount = profileLoading ? null : (stats?.sessions_count ?? 0);
  const avgProgress = useMemo(() => {
    if (typeof avgScore !== "number" || !Number.isFinite(avgScore) || !bestScore || bestScore <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (avgScore / bestScore) * 100));
  }, [avgScore, bestScore]);

  const topFiveSessions = recentSessions.slice(0, 5);
  const visibleSessions = showFullHistory ? recentSessions : topFiveSessions;

  async function handleSaveName() {
    if (!supabase || !user || saveState === "saving") return;

    setSaveState("saving");
    setStatusMessage("");

    const trimmedName = draftName.trim();
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: trimmedName || null,
    });

    if (error) {
      setSaveState("error");
      setStatusMessage("No se pudo guardar el nombre. Verifica la tabla profiles.");
      return;
    }

    setDisplayName(trimmedName);
    setStatusMessage("Nombre actualizado.");
    setSaveState("success");

    if (saveResetTimer.current) {
      window.clearTimeout(saveResetTimer.current);
    }

    saveResetTimer.current = window.setTimeout(() => {
      setSaveState("idle");
    }, 1800);
  }

  async function handleAvatarSave(nextAvatarId: string) {
    setCurrentAvatarId(getAvatarById(nextAvatarId).id);
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center text-sm text-foreground shadow-sm">
          <p className="font-semibold">Configuracion pendiente</p>
          <p className="mt-2 text-muted-foreground">
            Crea un archivo .env.local con las variables de Supabase y reinicia el servidor de desarrollo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <SpinnerIcon className="mb-4 h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-semibold text-muted-foreground">Verificando tu sesion...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8"
      style={{
        fontFamily: '"Segoe UI Variable", "Trebuchet MS", "Gill Sans", sans-serif',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_top,_var(--color-eco-emerald-100)_0%,_var(--card)_70%)] p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-24 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary sm:h-2.5 sm:w-2.5" />
                Sesion activa
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.replace("/login");
                  }}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-raised sm:px-4 sm:py-2 sm:text-sm"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-sm sm:h-20 sm:w-20 sm:border-[3px]">
                <span key={activeAvatar.id} className="avatar-bounce inline-block text-[28px] leading-none sm:text-[40px]">
                  {profileLoaded ? activeAvatar.emoji : "🌱"}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-foreground sm:text-3xl lg:text-4xl">{profileName}</h1>
                <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground sm:mt-1 sm:text-sm">{user?.email ?? "-"}</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-border bg-card/20 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:mt-3 sm:px-3 sm:py-1 sm:text-xs">
                  Cuenta creada: {createdAt}
                </div>
                <div className="mt-3 max-w-3xl sm:mt-4">
                  <AvatarSelector
                    currentAvatarId={currentAvatarId}
                    userStats={avatarStats}
                    onSave={handleAvatarSave}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-surface-raised p-3 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">Maximo puntaje</p>
                <p className="mt-1 text-2xl font-bold text-foreground sm:mt-2 sm:text-4xl">{bestScore ?? "..."}</p>
              </div>
              <TrophyIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">Promedio</p>
                <p className="mt-1 text-2xl font-bold text-foreground sm:mt-2 sm:text-4xl">
                  {profileLoading ? "..." : typeof avgScore === "number" ? avgScore.toFixed(1) : "-"}
                </p>
              </div>
              <BarsIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </div>

            <div className="mt-3 sm:mt-4">
              <div className="h-1.5 w-full rounded-full bg-surface-raised sm:h-2">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all sm:h-2"
                  style={{ width: `${avgProgress.toFixed(1)}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{Math.round(avgProgress)}% de tu maximo</p>
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">Partidas</p>
                <p className="mt-1 text-2xl font-bold text-foreground sm:mt-2 sm:text-4xl">{sessionsCount ?? "..."}</p>
              </div>
              <LeafIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">Ultima partida</p>
                <p className="mt-1 text-lg font-bold text-foreground sm:mt-2 sm:text-3xl">
                  {profileLoading ? "..." : formatShortDate(stats?.last_played_at)}
                </p>
              </div>
              <CalendarIcon className="h-6 w-6 text-primary sm:h-8 sm:w-8" />
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[3fr_2fr]">
          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Datos personales</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Administra tu identidad dentro de EcoURP.</p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Correo</p>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm font-semibold text-foreground">
                  <LockIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="max-w-full overflow-x-auto whitespace-nowrap">{user?.email ?? "-"}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Nombre para mostrar
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Tu nombre"
                    className="w-full flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    disabled={saveState === "saving"}
                    onClick={handleSaveName}
                    className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saveState === "saving" ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
                    {saveState === "success" ? <CheckIcon className="h-4 w-4 animate-bounce" /> : null}
                    <span>
                      {saveState === "saving"
                        ? "Guardando..."
                        : saveState === "success"
                          ? "Guardado"
                          : "Guardar"}
                    </span>
                  </button>
                </div>
                {statusMessage ? (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      saveState === "error" ? "text-rose-600" : "text-primary"
                    }`}
                  >
                    {statusMessage}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Modo favorito</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      MODE_BADGE_STYLES[favoriteMode.key]
                    }`}
                  >
                    {favoriteMode.label}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Logros</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Completa desafios para desbloquear insignias.</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-3">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = unlockedSet.has(achievement.id);
                const requirement = ACHIEVEMENT_REQUIREMENTS[achievement.id] ?? achievement.requirement;

                return (
                  <div
                    key={achievement.id}
                    title={`Requisito: ${requirement}`}
                    className={`group relative rounded-2xl border p-3 shadow-sm transition duration-200 hover:scale-105 hover:shadow-md ${
                      unlocked
                        ? "border-border bg-card"
                        : "border-border bg-surface-raised grayscale"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-primary">
                        <AchievementIcon id={achievement.id} className="h-6 w-6" />
                      </div>

                      {unlocked ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                          <LockIcon className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs font-semibold text-foreground sm:mt-3 sm:text-sm">{achievement.title}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground sm:mt-1 sm:text-xs">{achievement.description}</p>

                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-44 -translate-x-1/2 rounded-xl border border-border bg-card p-2 text-xs text-foreground opacity-0 shadow-sm transition group-hover:opacity-100">
                      Requisito exacto: {requirement}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Actividad reciente</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Tus ultimas partidas registradas.</p>
            </div>
            <span className="rounded-full border border-border bg-surface-raised px-2.5 py-0.5 text-[10px] font-semibold text-primary sm:px-3 sm:py-1 sm:text-xs">
              {Math.min(5, recentSessions.length)} recientes
            </span>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {visibleSessions.length ? (
              visibleSessions.map((sessionRow, index) => {
                const mode = normalizeMode(sessionRow.game_mode);
                const dateBadge = formatDayMonth(sessionRow.created_at);
                const sessionScore = typeof sessionRow.score === "number" ? sessionRow.score : 0;
                const isBest = !!bestScore && sessionScore > 0 && sessionScore === bestScore;

                return (
                  <article
                    key={`${sessionRow.created_at ?? "sin-fecha"}-${index}`}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-raised/60 px-3 py-2.5 shadow-sm sm:gap-4 sm:rounded-2xl sm:px-4 sm:py-3"
                  >
                    <div className="flex min-w-[52px] flex-col items-center rounded-lg border border-border bg-surface-raised px-1.5 py-1 text-center text-primary sm:min-w-[68px] sm:rounded-xl sm:px-2">
                      <span className="text-sm font-bold leading-none sm:text-lg">{dateBadge.day}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide sm:text-[10px]">{dateBadge.month}</span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                        MODE_BADGE_STYLES[mode]
                      }`}
                    >
                      {MODE_LABELS[mode]}
                    </span>

                    <div className="min-w-[60px] sm:min-w-[110px]">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary sm:text-xs">Puntaje</p>
                      <p className="text-lg font-bold text-foreground sm:text-2xl">{sessionScore}</p>
                    </div>

                    <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground sm:inline-flex sm:px-3 sm:py-1.5 sm:text-xs">
                      <ClockIcon className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                      {formatDuration(sessionRow.duration_ms)}
                    </div>

                    {isBest ? (
                      <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:px-3 sm:py-1 sm:text-xs">
                        <StarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Mejor
                      </div>
                    ) : (
                      <div className="ml-auto hidden text-xs text-muted-foreground sm:block">Sin record</div>
                    )}
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-raised px-4 py-8 text-center text-sm text-muted-foreground">
                Aun no hay partidas registradas.
              </div>
            )}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowFullHistory((value) => !value)}
              disabled={recentSessions.length <= 5}
              className="inline-flex items-center rounded-full border border-border bg-surface-raised px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showFullHistory ? "Ver solo ultimas 5" : "Ver historial completo"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
