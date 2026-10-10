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

Video blobs remain in browser IndexedDB until the editor explicitly uploads them using the secure cloud-upload control. Client review links can be loaded on another device after the Edge Functions are deployed and a Cloudflare video upload is complete. Anonymous clients use a narrow share-token endpoint rather than direct access to project tables.


## 6. Secure client review links and remote video

ReviewFlow can upload a browser-local video to Cloudflare Stream and associate the private asset with its project version. Cloudflare requires a separate paid Stream account/payment method for video storage and delivery. Current published pricing is **$5 per month per 1,000 minutes of stored video capacity** and **$1 per 1,000 minutes delivered**; upload and encoding are free. Storage is purchased in 1,000-minute capacity increments, so plan on at least $5/month for the first storage block, plus usage-based delivery. See the official [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/).

Create a Cloudflare API token restricted to the appropriate account with Stream read/write permissions. Keep this token private.

Link the Supabase CLI to this project and set the two Cloudflare secrets. Do not paste these values into source code or the browser:

~~~sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set CLOUDFLARE_ACCOUNT_ID=YOUR_ACCOUNT_ID CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
supabase functions deploy stream-upload
supabase functions deploy share-review --no-verify-jwt
~~~

The stream-upload function requires a signed-in editor and verifies project ownership before requesting a one-time resumable upload URL. The browser uploads TUS chunks directly to Cloudflare; the Cloudflare API token stays on the server. Uploaded assets require signed playback URLs. The share-review function is public by design because client reviewers do not need an account; it accepts only an unguessable project share token and exposes the current review, narrowly scoped comment/approve actions, and a short-lived signed playback URL. It does not grant anonymous access to database tables.

After deploying the functions, open a signed-in project with a video and click **Upload video to cloud**. When the upload completes, copy the review link and open it in a private browser window or on another device. Existing local videos are not automatically uploaded. A newly uploaded video may need a short time for Cloudflare to finish processing before playback becomes available.

This integration still needs a real Cloudflare account/token and a cross-device smoke test before production use. Do not share private tokens or paste them into chat.
