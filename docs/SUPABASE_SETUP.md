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

Open Supabase's SQL Editor and run `supabase/schema.sql`. If the tables already exist, run `supabase/migrations/20261010000000_cloud_project_sync.sql` instead to add the atomic project-sync function and allow completed historical versions.

The schema keeps editor-owned data behind Row Level Security. The app calls the `sync_reviewflow_project` database function as the signed-in user; it does not use a service-role key in the browser. The function writes a complete project/version/comment snapshot atomically, and RLS ensures the caller can only sync projects they own.

## 4. Authentication

The first cloud foundation supports email/password sign-up and sign-in. Supabase's current JavaScript API uses `signUp()` and `signInWithPassword()`, and the client persists the session by default.

## 5. Current scope and limitations

When Supabase is configured and the schema is installed, sign-in syncs project metadata, version history, comments, statuses, and approval state for the editor account. Existing local projects are imported on first account sync. Account-scoped browser caches keep local video references separate between signed-in users.

Video blobs are **not uploaded** by this milestone. They remain in IndexedDB on the browser where they were selected, so a project opened on another device can show its metadata and feedback but still needs secure remote video storage before it can be reviewed end-to-end. Anonymous client review access is still disabled intentionally; a later milestone will add secure Cloudflare Stream delivery and narrow share-link endpoints.
