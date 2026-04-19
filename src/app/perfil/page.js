"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { ACHIEVEMENTS } from "@/lib/achievementsCatalog";

const MODE_LABELS = {
  easy: "Facil",
  normal: "Normal",
  hard: "Dificil",
  timed: "Contrarreloj",
  zen: "Zen",
};

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export default function PerfilPage() {
  const router = useRouter();
  const {
    session,
    user,
    loading,
    isConfigured,
    connectionChecked,
    connectionError,
    signOut,
  } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [status, setStatus] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

  const favoriteMode = useMemo(() => {
    if (!recentSessions.length) return "-";
    const counts = new Map();
    recentSessions.forEach((sessionRow) => {
      const mode = sessionRow.game_mode || "normal";
      counts.set(mode, (counts.get(mode) || 0) + 1);
    });
    let topMode = "normal";
    let topCount = 0;
    counts.forEach((count, mode) => {
      if (count > topCount) {
        topCount = count;
        topMode = mode;
      }
    });
    return MODE_LABELS[topMode] || "Normal";
  }, [recentSessions]);

  useEffect(() => {
    if (!loading && isConfigured && !session) {
      router.replace("/login?next=/perfil");
    }
  }, [loading, session, isConfigured, router]);

  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;
    async function loadProfile() {
      setProfileLoading(true);
      setStatus("");

      const [
        { data: profileData },
        { data: scoreData },
        { data: statsData },
        { data: sessionsData },
        { data: achievementsData },
      ] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("ecourp_tacho_scores")
          .select("max_score")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("ecourp_tacho_profile_stats")
          .select("sessions_count,best_score,avg_score,last_played_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("ecourp_tacho_sessions")
          .select("score,game_mode,duration_ms,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ecourp_user_achievements")
          .select("achievement_id")
          .eq("user_id", user.id),
      ]);

      if (!isMounted) return;

      const name = profileData?.display_name?.trim() || "";
      setDisplayName(name);
      setDraftName(name);
      setScore(statsData?.best_score ?? scoreData?.max_score ?? 0);
      setStats(statsData ?? null);
      setRecentSessions(sessionsData ?? []);
      setUnlockedAchievements(
        (achievementsData ?? []).map((row) => row.achievement_id).filter(Boolean)
      );
      setProfileLoading(false);
      setProfileLoaded(true);
    }

    loadProfile().catch(() => {
      if (!isMounted) return;
      setProfileLoading(false);
      setStatus("No se pudo cargar tu perfil.");
      setProfileLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const createdAt = useMemo(() => {
    const raw = user?.created_at;
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user]);

  const unlockedSet = useMemo(
    () => new Set(unlockedAchievements),
    [unlockedAchievements]
  );

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-eco-emerald-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50/90 p-8 text-center text-sm text-amber-900 shadow-sm">
          <p className="font-medium">Configuracion pendiente</p>
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
          <p className="text-sm font-medium text-eco-emerald-800">Verificando tu sesion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-eco-emerald-100/70 via-eco-emerald-50 to-eco-emerald-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
              Mi cuenta
            </p>
            <h1 className="text-2xl font-bold text-eco-emerald-950 sm:text-3xl">
              Tu perfil EcoURP
            </h1>
            <p className="mt-2 text-sm text-eco-emerald-700">
              Administra tu nombre, revisa tu progreso y confirma que tu sesion esta activa.
            </p>
          </div>
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
              Cerrar sesion
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
            <div>
              <h2 className="text-lg font-semibold text-eco-emerald-900">Datos personales</h2>
              <p className="mt-1 text-sm text-eco-emerald-700">
                Estos datos se muestran en tu menu y en la plataforma.
              </p>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Correo
                </p>
                <p className="mt-2 rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 px-4 py-3 text-sm font-medium text-eco-emerald-900">
                  <span className="block max-w-full overflow-x-auto whitespace-nowrap">
                    {user?.email}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Creada el
                </p>
                <p className="mt-2 rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 px-4 py-3 text-sm font-medium text-eco-emerald-900">
                  {createdAt || "-"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                Nombre para mostrar
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Tu nombre"
                  className="w-full flex-1 rounded-2xl border border-eco-emerald-200 bg-white px-4 py-3 text-sm text-eco-emerald-900 shadow-sm outline-none transition focus:border-eco-emerald-500 focus:ring-2 focus:ring-eco-emerald-200"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!supabase || !user) return;
                    setSaving(true);
                    setStatus("");
                    const { error } = await supabase.from("profiles").upsert({
                      id: user.id,
                      display_name: draftName.trim() || null,
                    });
                    if (error) {
                      setStatus("No se pudo guardar el nombre. Verifica la tabla profiles.");
                    } else {
                      setDisplayName(draftName.trim());
                      setStatus("Nombre actualizado.");
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl bg-eco-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-eco-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
              {status ? (
                <p className="mt-2 text-xs font-medium text-eco-emerald-700">{status}</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
            <h2 className="text-lg font-semibold text-eco-emerald-900">Resumen</h2>
            <p className="mt-1 text-sm text-eco-emerald-700">
              Tu progreso y actividad reciente.
            </p>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-eco-emerald-100 bg-eco-emerald-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                  Nombre actual
                </p>
                <p className="mt-2 text-lg font-semibold text-eco-emerald-900">
                  {profileLoaded
                    ? displayName || user?.email?.split("@")[0] || "EcoURP"
                    : "Cargando…"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-eco-lime-200 bg-eco-lime-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Maximo puntaje
                  </p>
                  <p className="mt-2 text-3xl font-bold text-eco-emerald-900">
                    {profileLoading ? "…" : score ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-eco-emerald-700">
                    Sigue jugando para mejorar tu record.
                  </p>
                </div>

                <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Promedio
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-eco-emerald-900">
                    {profileLoading
                      ? "…"
                      : typeof stats?.avg_score === "number"
                        ? stats.avg_score.toFixed(1)
                        : "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Partidas jugadas
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-eco-emerald-900">
                    {profileLoading ? "…" : stats?.sessions_count ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Ultima partida
                  </p>
                  <p className="mt-2 text-base font-semibold text-eco-emerald-900">
                    {profileLoading ? "…" : formatShortDate(stats?.last_played_at)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Modo favorito
                  </p>
                  <p className="mt-2 text-base font-semibold text-eco-emerald-900">
                    {profileLoading ? "…" : favoriteMode}
                  </p>
                </div>

                <div className="rounded-2xl border border-eco-emerald-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-eco-emerald-500">
                    Estado de la sesion
                  </p>
                  <p className="mt-2 text-sm font-semibold text-eco-emerald-900">
                    Sesion activa
                  </p>
                  <p className="mt-1 text-xs text-eco-emerald-700">
                    Tu cuenta esta verificada y lista para seguir aprendiendo.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
          <div>
            <h2 className="text-lg font-semibold text-eco-emerald-900">Logros</h2>
            <p className="mt-1 text-sm text-eco-emerald-700">
              Desbloquea logros jugando y mejorando tu puntaje.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = unlockedSet.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className="group relative flex flex-col items-center gap-2 rounded-2xl border border-eco-emerald-100 bg-white/80 p-3"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition ${
                      unlocked
                        ? "border-eco-emerald-300 bg-gradient-to-br from-eco-emerald-100 to-eco-lime-100 text-eco-emerald-800"
                        : "border-eco-emerald-100 bg-eco-emerald-50 text-eco-emerald-300"
                    }`}
                  >
                    {achievement.iconText || "LOGO"}
                  </div>
                  <p
                    className={`text-center text-xs font-semibold ${
                      unlocked ? "text-eco-emerald-900" : "text-eco-emerald-400"
                    }`}
                  >
                    {achievement.title}
                  </p>

                  <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 -translate-y-full opacity-0 transition group-hover:opacity-100">
                    <div className="rounded-2xl border border-eco-emerald-200 bg-white px-3 py-2 text-xs text-eco-emerald-800 shadow-lg">
                      <p className="font-semibold text-eco-emerald-900">
                        {achievement.title}
                      </p>
                      <p className="mt-1 text-eco-emerald-700">
                        {achievement.tooltip?.[0] || achievement.requirement}
                      </p>
                      {achievement.tooltip?.[1] ? (
                        <p className="mt-1 text-eco-emerald-700">
                          {achievement.tooltip[1]}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-eco-emerald-200 bg-white/95 p-8 shadow-lg shadow-eco-emerald-900/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-eco-emerald-900">
                Actividad reciente
              </h2>
              <p className="mt-1 text-sm text-eco-emerald-700">
                Ultimas 5 partidas registradas.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-eco-emerald-100">
            {recentSessions.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-eco-emerald-50 text-xs uppercase tracking-wide text-eco-emerald-600">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Modo</th>
                    <th className="px-4 py-3">Puntaje</th>
                    <th className="px-4 py-3">Duracion</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((sessionRow, index) => (
                    <tr
                      key={`${sessionRow.created_at}-${index}`}
                      className="border-t border-eco-emerald-100"
                    >
                      <td className="px-4 py-3 text-eco-emerald-900">
                        {formatShortDate(sessionRow.created_at)}
                      </td>
                      <td className="px-4 py-3 text-eco-emerald-900">
                        {MODE_LABELS[sessionRow.game_mode] || "Normal"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-eco-emerald-900">
                        {sessionRow.score}
                      </td>
                      <td className="px-4 py-3 text-eco-emerald-700">
                        {formatDuration(sessionRow.duration_ms)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-sm text-eco-emerald-700">
                Aun no hay partidas registradas.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
