-- Free-plan guardrails for Cloudinary-hosted review copies.
-- This table is service-role-only. The browser never receives direct table access.

create table if not exists public.cloudinary_video_reservations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  version_number integer not null check (version_number > 0),
  public_id text not null unique,
  input_bytes bigint not null check (input_bytes > 0),
  stored_bytes bigint not null default 0 check (stored_bytes >= 0),
  duration_seconds numeric(12, 3) not null check (duration_seconds > 0),
  reserved_at timestamptz not null default now(),
  uploaded_at timestamptz,
  active boolean not null default true
);

alter table public.cloudinary_video_reservations enable row level security;
revoke all on public.cloudinary_video_reservations from anon, authenticated;
grant all on public.cloudinary_video_reservations to service_role;

create index if not exists cloudinary_reservations_active_idx
  on public.cloudinary_video_reservations (active, reserved_at);
create index if not exists cloudinary_reservations_project_idx
  on public.cloudinary_video_reservations (owner_id, project_id);

-- Conservative app-level limits, intentionally well below Cloudinary Free's
-- 25-credit allowance: 1 GiB uploaded in any rolling 30 days, 30 minutes of
-- video processed in that window, and 2 GiB of active stored review copies.
-- Single uploads are capped separately in the Edge Function.
create or replace function public.reserve_cloudinary_video_upload(
  p_owner_id uuid,
  p_project_id uuid,
  p_version_number integer,
  p_file_bytes bigint,
  p_duration_seconds numeric,
  p_public_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_bytes numeric;
  v_rolling_bytes numeric;
  v_rolling_seconds numeric;
  v_reservation_id uuid;
begin
  perform pg_advisory_xact_lock(917244, 18425);

  update public.cloudinary_video_reservations
  set active = false
  where active = true
    and uploaded_at is null
    and reserved_at < now() - interval '12 hours';

  if p_file_bytes <= 0 or p_file_bytes > 262144000 then
    raise exception 'Cloudinary upload exceeds the 250 MB per-file limit'
      using errcode = '22023';
  end if;

  if p_duration_seconds <= 0 or p_duration_seconds > 600 then
    raise exception 'Cloudinary upload exceeds the 10-minute per-video limit'
      using errcode = '22023';
  end if;

  select coalesce(sum(case when uploaded_at is null then input_bytes else stored_bytes end), 0)
    into v_active_bytes
  from public.cloudinary_video_reservations
  where active = true
    and (uploaded_at is not null or reserved_at > now() - interval '12 hours');

  select
    coalesce(sum(input_bytes), 0),
    coalesce(sum(duration_seconds), 0)
    into v_rolling_bytes, v_rolling_seconds
  from public.cloudinary_video_reservations
  where reserved_at > now() - interval '30 days'
    and (uploaded_at is not null or (active = true and reserved_at > now() - interval '12 hours'));

  if v_active_bytes + p_file_bytes > 2147483648 then
    raise exception 'Cloudinary free storage limit reached. Delete an old review copy before uploading another video.'
      using errcode = 'P0001';
  end if;

  if v_rolling_bytes + p_file_bytes > 1073741824 then
    raise exception 'ReviewFlow free upload quota reached for the last 30 days (1 GiB).'
      using errcode = 'P0001';
  end if;

  if v_rolling_seconds + p_duration_seconds > 1800 then
    raise exception 'ReviewFlow free video-processing quota reached for the last 30 days (30 minutes).'
      using errcode = 'P0001';
  end if;

  insert into public.cloudinary_video_reservations (
    owner_id, project_id, version_number, public_id, input_bytes, duration_seconds
  )
  values (
    p_owner_id, p_project_id, p_version_number, p_public_id, p_file_bytes, p_duration_seconds
  )
  returning id into v_reservation_id;

  return jsonb_build_object('ok', true, 'reservation_id', v_reservation_id);
end;
$$;

revoke all on function public.reserve_cloudinary_video_upload(uuid, uuid, integer, bigint, numeric, text) from public, anon, authenticated;
grant execute on function public.reserve_cloudinary_video_upload(uuid, uuid, integer, bigint, numeric, text) to service_role;
