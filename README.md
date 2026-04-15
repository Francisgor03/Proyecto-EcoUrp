# EcoURP

Plataforma educativa sobre reciclaje con un juego interactivo y autenticacion via Supabase.

## Requisitos

- Node.js 18+ (recomendado 20+)
- Cuenta en Supabase

## Configuracion de Supabase (desde cero)

1. Crea un proyecto en https://supabase.com
2. En Authentication > Providers, habilita Email.
3. En SQL Editor, ejecuta el siguiente SQL para la tabla de puntajes y RLS:

```sql
create table if not exists public.ecourp_tacho_scores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  max_score integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ecourp_tacho_scores enable row level security;

create policy "Lectura propia"
  on public.ecourp_tacho_scores
  for select
  using (auth.uid() = user_id);

create policy "Upsert propio"
  on public.ecourp_tacho_scores
  for insert
  with check (auth.uid() = user_id);

create policy "Actualizacion propia"
  on public.ecourp_tacho_scores
  for update
  using (auth.uid() = user_id);
```

## Variables de entorno

1. Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

2. Completa los valores en .env.local:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_publica
```

## Ejecutar el proyecto

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Flujos principales

- Crear cuenta: pestaña "Crear cuenta" en /login.
- Recuperar cuenta: pestaña "Recuperar" en /login.
- Jugar: /juego (requiere sesion activa).
- Guardado de puntaje: automatico al terminar la partida (tabla ecourp_tacho_scores).

## Notas

- Si ves el mensaje de Supabase no configurado, revisa el archivo .env.local y reinicia el servidor.
- Para despliegue, asegurate de configurar las variables de entorno en tu plataforma (Vercel, Render, etc.).
