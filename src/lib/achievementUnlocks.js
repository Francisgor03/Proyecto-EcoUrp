import { supabase } from "@/lib/supabaseClient";
import { ACHIEVEMENT_IDS } from "@/lib/achievementsCatalog";

function getDistinctModeCount(rows) {
  if (!Array.isArray(rows)) return 0;
  const modes = new Set();
  rows.forEach((row) => {
    if (typeof row?.game_mode === "string" && row.game_mode.trim()) {
      modes.add(row.game_mode.trim());
    }
  });
  return modes.size;
}

function buildEligibility({
  sessionsCount,
  bestScore,
  latestScore,
  latestMode,
  distinctModesCount,
}) {
  return {
    [ACHIEVEMENT_IDS.first_session]: sessionsCount >= 1,
    [ACHIEVEMENT_IDS.five_sessions]: sessionsCount >= 5,
    [ACHIEVEMENT_IDS.normal_50]:
      latestMode === "normal" && typeof latestScore === "number" && latestScore >= 50,
    [ACHIEVEMENT_IDS.score_100]: typeof bestScore === "number" && bestScore >= 100,
    [ACHIEVEMENT_IDS.modes_3]: distinctModesCount >= 3,
  };
}

export async function unlockTachoAchievements({ userId, latestScore, latestMode }) {
  if (!supabase || !userId) return [];

  const [{ data: statsRow }, { data: sessionsRows }, { data: unlockedRows }] =
    await Promise.all([
      supabase
        .from("ecourp_tacho_profile_stats")
        .select("sessions_count,best_score")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("ecourp_tacho_sessions")
        .select("game_mode")
        .eq("user_id", userId),
      supabase
        .from("ecourp_user_achievements")
        .select("achievement_id")
        .eq("user_id", userId),
    ]);

  const sessionsCount = statsRow?.sessions_count ?? 0;
  const bestScore = statsRow?.best_score ?? 0;
  const distinctModesCount = getDistinctModeCount(sessionsRows);

  const eligibility = buildEligibility({
    sessionsCount,
    bestScore,
    latestScore,
    latestMode,
    distinctModesCount,
  });

  const unlockedSet = new Set(
    (unlockedRows ?? []).map((row) => row.achievement_id).filter(Boolean)
  );

  const newlyUnlocked = Object.keys(eligibility).filter(
    (achievementId) => eligibility[achievementId] && !unlockedSet.has(achievementId)
  );

  if (!newlyUnlocked.length) return [];

  const { error } = await supabase.from("ecourp_user_achievements").insert(
    newlyUnlocked.map((achievementId) => ({
      user_id: userId,
      achievement_id: achievementId,
    }))
  );

  if (error) {
    console.warn("[EcoURP] No se pudo guardar logro:", error.message);
    return [];
  }

  return newlyUnlocked;
}
