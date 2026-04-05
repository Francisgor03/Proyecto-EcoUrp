import { supabase } from "@/lib/supabaseClient";

/**
 * Guarda el puntaje máximo del usuario en Supabase (tabla `ecourp_tacho_scores`).
 *
 * SQL sugerido (ejecutar en el SQL Editor del proyecto):
 *
 * create table if not exists public.ecourp_tacho_scores (
 *   user_id uuid primary key references auth.users (id) on delete cascade,
 *   max_score integer not null default 0,
 *   updated_at timestamptz not null default now()
 * );
 * alter table public.ecourp_tacho_scores enable row level security;
 * create policy "Lectura propia" on public.ecourp_tacho_scores for select using (auth.uid() = user_id);
 * create policy "Upsert propio" on public.ecourp_tacho_scores for insert with check (auth.uid() = user_id);
 * create policy "Actualización propia" on public.ecourp_tacho_scores for update using (auth.uid() = user_id);
 *
 * @param {number} score Puntaje de la partida actual
 */
export async function saveTachoHighScore(score) {
  if (!supabase || typeof score !== "number" || !Number.isFinite(score)) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  const { data: row, error: selectError } = await supabase
    .from("ecourp_tacho_scores")
    .select("max_score")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    console.warn("[EcoURP] No se pudo leer puntaje:", selectError.message);
  }

  const previous = row?.max_score ?? 0;
  if (score <= previous) return;

  const { error: upsertError } = await supabase.from("ecourp_tacho_scores").upsert(
    {
      user_id: user.id,
      max_score: Math.floor(score),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.warn("[EcoURP] No se pudo guardar puntaje:", upsertError.message);
  }
}
