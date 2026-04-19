import { supabase } from "@/lib/supabaseClient";
import { unlockTachoAchievements } from "@/lib/achievementUnlocks";

/**
 * Guarda una sesion de juego en Supabase (tabla `ecourp_tacho_sessions`).
 * @param {{ score: number, gameMode?: string, durationMs?: number }} payload
 */
export async function saveTachoSession(payload) {
  if (!supabase || !payload || typeof payload.score !== "number") return;

  const score = Number.isFinite(payload.score) ? Math.floor(payload.score) : 0;
  const gameMode = typeof payload.gameMode === "string" ? payload.gameMode : null;
  const durationMs =
    typeof payload.durationMs === "number" && Number.isFinite(payload.durationMs)
      ? Math.max(0, Math.floor(payload.durationMs))
      : null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  const { error } = await supabase.from("ecourp_tacho_sessions").insert({
    user_id: user.id,
    score,
    game_mode: gameMode,
    duration_ms: durationMs,
  });

  if (error) {
    console.warn("[EcoURP] No se pudo guardar sesion:", error.message);
    return;
  }

  const newlyUnlocked = await unlockTachoAchievements({
    userId: user.id,
    latestScore: score,
    latestMode: gameMode || "normal",
  });

  if (newlyUnlocked.length && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("ecourp:achievement-unlocked", {
        detail: {
          achievementIds: newlyUnlocked,
        },
      })
    );
  }
}
