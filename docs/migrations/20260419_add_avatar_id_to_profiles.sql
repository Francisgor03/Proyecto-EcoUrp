alter table if exists public.profiles
add column if not exists avatar_id text not null default 'sprout';

update public.profiles
set avatar_id = 'sprout'
where avatar_id is null;
