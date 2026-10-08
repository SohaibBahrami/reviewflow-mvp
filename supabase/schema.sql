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
  status text not null default 'in_review' check (status in ('in_review', 'approved')),
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
