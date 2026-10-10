-- ReviewFlow cloud foundation
-- Run this in the Supabase SQL Editor after creating a project.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text not null,
  status text not null default 'in_review' check (status in ('in_review', 'approved', 'completed', 'trashed')),
  current_version integer not null default 1 check (current_version > 0),
  share_token uuid not null unique default gen_random_uuid(),
  status_before_trash text check (status_before_trash in ('in_review', 'approved', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  trashed_at timestamptz
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'in_review' check (status in ('in_review', 'approved', 'completed')),
  video_provider text,
  video_asset_id text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (project_id, version_number)
);

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.project_versions(id) on delete cascade,
  timestamp_seconds numeric(12, 3) not null check (timestamp_seconds >= 0),
  body text not null,
  author_name text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists project_versions_project_id_idx on public.project_versions(project_id);
create index if not exists review_comments_version_id_idx on public.review_comments(version_id);

alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.review_comments enable row level security;

drop policy if exists "owners can read projects" on public.projects;
drop policy if exists "owners can insert projects" on public.projects;
drop policy if exists "owners can update projects" on public.projects;
drop policy if exists "owners can delete projects" on public.projects;

create policy "owners can read projects"
on public.projects for select to authenticated
using (owner_id = (select auth.uid()));

create policy "owners can insert projects"
on public.projects for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "owners can update projects"
on public.projects for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "owners can delete projects"
on public.projects for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "owners can read versions" on public.project_versions;
drop policy if exists "owners can write versions" on public.project_versions;

create policy "owners can read versions"
on public.project_versions for select to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_versions.project_id
      and p.owner_id = (select auth.uid())
  )
);

create policy "owners can write versions"
on public.project_versions for all to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_versions.project_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_versions.project_id
      and p.owner_id = (select auth.uid())
  )
);

drop policy if exists "owners can read comments" on public.review_comments;
drop policy if exists "owners can write comments" on public.review_comments;

create policy "owners can read comments"
on public.review_comments for select to authenticated
using (
  exists (
    select 1
    from public.project_versions v
    join public.projects p on p.id = v.project_id
    where v.id = review_comments.version_id
      and p.owner_id = (select auth.uid())
  )
);

create policy "owners can write comments"
on public.review_comments for all to authenticated
using (
  exists (
    select 1
    from public.project_versions v
    join public.projects p on p.id = v.project_id
    where v.id = review_comments.version_id
      and p.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.project_versions v
    join public.projects p on p.id = v.project_id
    where v.id = review_comments.version_id
      and p.owner_id = (select auth.uid())
  )
);

-- Anonymous client review access is intentionally not granted here.
-- It will be added later through a narrow server-side/share-link path,
-- rather than exposing the whole projects table to anonymous users.


-- ReviewFlow authenticated project metadata sync.
-- Safe to run after the initial supabase/schema.sql setup.

alter table public.project_versions
  drop constraint if exists project_versions_status_check;
alter table public.project_versions
  add constraint project_versions_status_check
  check (status in ('in_review', 'approved', 'completed'));

create or replace function public.sync_reviewflow_project(project_data jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_owner_id uuid := auth.uid();
  v_project_id uuid;
  v_version jsonb;
  v_comment jsonb;
  v_version_id uuid;
  v_comment_id uuid;
  v_version_number integer;
  v_version_status text;
  v_created_at timestamptz;
  v_body text;
begin
  if v_owner_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if jsonb_typeof(project_data) <> 'object' then
    raise exception 'Project payload must be a JSON object' using errcode = '22023';
  end if;

  v_project_id := nullif(project_data->>'id', '')::uuid;

  if v_project_id is null then
    raise exception 'Project id is required' using errcode = '22023';
  end if;

  insert into public.projects (
    id, owner_id, title, client_name, status, current_version,
    share_token, status_before_trash, created_at, completed_at, trashed_at
  )
  values (
    v_project_id,
    v_owner_id,
    btrim(coalesce(project_data->>'title', '')),
    btrim(coalesce(project_data->>'client_name', '')),
    project_data->>'status',
    (project_data->>'current_version')::integer,
    (project_data->>'share_token')::uuid,
    nullif(project_data->>'status_before_trash', ''),
    coalesce(nullif(project_data->>'created_at', '')::timestamptz, now()),
    nullif(project_data->>'completed_at', '')::timestamptz,
    nullif(project_data->>'trashed_at', '')::timestamptz
  )
  on conflict (id) do update set
    title = excluded.title,
    client_name = excluded.client_name,
    status = excluded.status,
    current_version = excluded.current_version,
    share_token = excluded.share_token,
    status_before_trash = excluded.status_before_trash,
    created_at = excluded.created_at,
    completed_at = excluded.completed_at,
    trashed_at = excluded.trashed_at
  where public.projects.owner_id = v_owner_id;

  if not found then
    raise exception 'Project does not exist or is not owned by the current user'
      using errcode = '42501';
  end if;

  -- The caller is the authenticated owner (enforced by RLS above). Replacing
  -- children in this transaction keeps a project/version/comment snapshot atomic.
  delete from public.project_versions where project_id = v_project_id;

  for v_version in
    select value
    from jsonb_array_elements(coalesce(project_data->'versions', '[]'::jsonb)) as versions(value)
  loop
    v_version_number := (v_version->>'version_number')::integer;
    v_version_status := coalesce(v_version->>'status', 'in_review');
    v_created_at := coalesce(nullif(v_version->>'created_at', '')::timestamptz, now());

    insert into public.project_versions (
      project_id, version_number, status, video_provider, video_asset_id,
      created_at, approved_at
    )
    values (
      v_project_id,
      v_version_number,
      v_version_status,
      nullif(v_version->>'video_provider', ''),
      nullif(v_version->>'video_asset_id', ''),
      v_created_at,
      nullif(v_version->>'approved_at', '')::timestamptz
    )
    returning id into v_version_id;

    for v_comment in
      select value
      from jsonb_array_elements(coalesce(v_version->'comments', '[]'::jsonb)) as comments(value)
    loop
      v_body := btrim(coalesce(v_comment->>'body', ''));
      if v_body = '' then
        continue;
      end if;

      if coalesce(v_comment->>'id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        v_comment_id := (v_comment->>'id')::uuid;
      else
        v_comment_id := gen_random_uuid();
      end if;

      insert into public.review_comments (
        id, version_id, timestamp_seconds, body, author_name, status, created_at
      )
      values (
        v_comment_id,
        v_version_id,
        greatest(0, coalesce(nullif(v_comment->>'timestamp_seconds', '')::numeric, 0)),
        v_body,
        coalesce(nullif(btrim(v_comment->>'author_name'), ''), 'You'),
        case when v_comment->>'status' = 'resolved' then 'resolved' else 'open' end,
        coalesce(nullif(v_comment->>'created_at', '')::timestamptz, now())
      );
    end loop;
  end loop;
end;
$$;

revoke all on function public.sync_reviewflow_project(jsonb) from public;
grant select, insert, update, delete on public.projects, public.project_versions, public.review_comments to authenticated;
grant execute on function public.sync_reviewflow_project(jsonb) to authenticated;
