-- EcoURP: esquema para sesiones de juego y estadisticas

create table if not exists public.ecourp_tacho_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null default 0,
  game_mode text null,
  duration_ms integer null,
  created_at timestamptz not null default now()
);

alter table public.ecourp_tacho_sessions enable row level security;

create policy "Lectura propia sesiones" on public.ecourp_tacho_sessions
  for select using (auth.uid() = user_id);

create policy "Insertar propia sesion" on public.ecourp_tacho_sessions
  for insert with check (auth.uid() = user_id);

-- Ranking por modo de juego
create table if not exists public.ecourp_tacho_scores_mode (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_mode text not null,
  max_score integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_mode)
);

alter table public.ecourp_tacho_scores_mode enable row level security;
create policy "Lectura propia ranking modo" on public.ecourp_tacho_scores_mode
  for select using (auth.uid() = user_id);
create policy "Upsert propio ranking modo" on public.ecourp_tacho_scores_mode
  for insert with check (auth.uid() = user_id);
create policy "Actualizacion propia ranking modo" on public.ecourp_tacho_scores_mode
  for update using (auth.uid() = user_id);

-- Vista de estadisticas agregadas por usuario
create or replace view public.ecourp_tacho_profile_stats as
select
  user_id,
  count(*)::int as sessions_count,
  max(score)::int as best_score,
  avg(score)::numeric(10,2) as avg_score,
  max(created_at) as last_played_at
from public.ecourp_tacho_sessions
group by user_id;

-- Ejecuta la vista con los permisos del usuario (aplica RLS de tablas base)
alter view public.ecourp_tacho_profile_stats set (security_invoker = true);

-- Opcional: habilita leaderboard publico (si se requiere)
-- create policy "Lectura publica leaderboard" on public.ecourp_tacho_scores
--   for select using (true);

-- Opcional: habilita leaderboard publico por modo (si se requiere)
-- create policy "Lectura publica leaderboard modo" on public.ecourp_tacho_scores_mode
--   for select using (true);

-- Opcional: permitir leer display_name en el ranking (si se requiere)
-- create policy "Lectura publica perfiles" on public.profiles
--   for select using (true);

-- Logros basicos (catalogo)
create table if not exists public.ecourp_achievements (
  id text primary key,
  title text not null,
  description text not null,
  requirement_text text not null,
  icon_key text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ecourp_achievements enable row level security;

create policy "Lectura publica logros" on public.ecourp_achievements
  for select using (true);

-- Logros desbloqueados por usuario
create table if not exists public.ecourp_user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.ecourp_achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.ecourp_user_achievements enable row level security;

create policy "Lectura propia logros" on public.ecourp_user_achievements
  for select using (auth.uid() = user_id);

create policy "Insertar propio logro" on public.ecourp_user_achievements
  for insert with check (auth.uid() = user_id);

-- Seed de logros basicos (usa on conflict para no duplicar)
insert into public.ecourp_achievements
  (id, title, description, requirement_text, icon_key, sort_order)
values
  ('first_session', 'Primer paso', 'Tu primera partida registrada.', 'Juega tu primera partida.', 'A1', 1),
  ('five_sessions', 'Eco constante', 'Cinco partidas completadas.', 'Completa 5 partidas.', 'A2', 2),
  ('normal_50', 'Racha normal', 'Supera 50 puntos en modo Normal.', 'Consigue 50 puntos en modo Normal.', 'A3', 3),
  ('score_100', 'Centenario', 'Supera 100 puntos en cualquier modo.', 'Consigue 100 puntos en cualquier modo.', 'A4', 4),
  ('modes_3', 'Explorador', 'Juega 3 modos distintos.', 'Juega 3 modos distintos.', 'A5', 5)
on conflict (id) do nothing;
