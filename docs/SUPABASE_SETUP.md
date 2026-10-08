# Supabase setup

ReviewFlow uses Supabase as the planned cloud foundation for editor accounts and persistent project data.

## 1. Create a Supabase project

Create a project in the Supabase dashboard, then open its Connect panel and copy the project URL and publishable key. Current Supabase React guidance uses `@supabase/supabase-js` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in a local environment file.

## 2. Configure local environment

Create `.env.local` in the project root:

```text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never commit `.env.local` or service-role keys.

## 3. Create the database tables

Open Supabase's SQL Editor and run `supabase/schema.sql`.

The schema keeps editor-owned data behind Row Level Security. Current Supabase guidance recommends enabling RLS on exposed tables and using policies to define least-privilege access.

## 4. Authentication

The first cloud foundation supports email/password sign-up and sign-in. Supabase's current JavaScript API uses `signUp()` and `signInWithPassword()`, and the client persists the session by default.

## 5. What is intentionally not migrated yet

The existing local project store remains the active data source until the database connection is configured and tested. Video blobs also remain browser-local in this milestone. Cloud video storage and public review access are separate milestones.
