# Supabase setup

ReviewFlow uses Supabase for editor accounts, persistent project metadata, comments, approvals, and share-link authorization. Original video files stay in the creator's browser unless the creator explicitly creates a remote review copy.

## 1. Create a Supabase project

Create a project in the Supabase dashboard, then open its Connect panel and copy the project URL and publishable key. Current Supabase React guidance uses \`@supabase/supabase-js\` with \`VITE_SUPABASE_URL\` and \`VITE_SUPABASE_PUBLISHABLE_KEY\` in a local environment file.

## 2. Configure local environment

Create \`.env.local\` in the project root:

\`\`\`text
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
\`\`\`

Never commit \`.env.local\` or service-role keys.

## 3. Create or update the database schema

For a new project, open Supabase's SQL Editor and run \`supabase/schema.sql\`. For an existing project with ReviewFlow tables already installed, run the migrations in order if they have not yet been applied:

1. \`supabase/migrations/20261010000000_cloud_project_sync.sql\`
2. \`supabase/migrations/20261011000000_cloudinary_free_video_quota.sql\`

Do not rerun the original schema or migrations blindly against an existing database. The Cloudinary migration creates a private, service-role-only reservation table and an atomic upload-quota gate.

The project metadata sync uses \`sync_reviewflow_project\` as the signed-in editor. Row Level Security restricts editor data to its owner; anonymous clients use the narrow \`share-review\` Edge Function rather than direct table access.

## 4. Configure Cloudinary Free

ReviewFlow's remote video option targets Cloudinary's Free plan. Cloudinary lists the plan as **$0, free forever, and no credit card required**, with 25 monthly credits shared across storage, transformations, and delivery. Check the official [pricing page](https://cloudinary.com/pricing) before using it; free service is limited and not unlimited hosting.

Create a Cloudinary account without adding payment details. From the Cloudinary Console, copy the **Cloud name**, **API Key**, and **API Secret**. In Supabase Dashboard → Edge Functions → Secrets, add:

| Key | Value |
|---|---|
| \`CLOUDINARY_CLOUD_NAME\` | Cloudinary Cloud name |
| \`CLOUDINARY_API_KEY\` | Cloudinary API Key |
| \`CLOUDINARY_API_SECRET\` | Cloudinary API Secret |

Do not add the API secret to browser variables or commit it. Supabase supplies \`SUPABASE_URL\` and \`SUPABASE_SERVICE_ROLE_KEY\` to Edge Functions automatically.

Deploy from a checkout of the reviewed branch after its changes are merged:

\`\`\`sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy cloudinary-upload
supabase functions deploy share-review --no-verify-jwt
\`\`\`

The \`cloudinary-upload\` function requires an authenticated creator and validates project ownership. It generates a signed upload authorization, so the API secret stays server-side. The public \`share-review\` function only responds to an unguessable project share token and exposes narrowly scoped review actions.

## 5. Free-plan guardrails in ReviewFlow

The application deliberately blocks uploads at these conservative limits:

- Maximum 250 MB per review copy.
- Maximum 10 minutes per video.
- Maximum 1 GiB of input video uploads in a rolling 30-day window.
- Maximum 30 minutes of video submitted for processing in a rolling 30-day window.
- Maximum 2 GiB of active stored review-copy assets as tracked by ReviewFlow.

Deleting a project's remote review copies frees the app's active-storage allowance. Previously uploaded files still count against the rolling upload and processing budgets for the rest of their 30-day window.

Cloudinary counts usage across your whole Cloudinary account, not just ReviewFlow. These app-level limits are conservative guardrails, not a precise mirror of Cloudinary's credit meter or a guarantee against reaching the provider's free quota. Check usage in Cloudinary and **do not add payment details or upgrade**. If Cloudinary reaches the free quota, stop uploading and wait for the usage allowance to reset.

## 6. What happens to videos

- The original remains in the creator's browser's IndexedDB storage.
- The creator must explicitly upload a review copy. ReviewFlow caps file size and duration before requesting authorization.
- Cloudinary stores an authenticated review copy, resizes it to a maximum 1280×720 frame, bakes in a small "REVIEW COPY" label, and generates an HLS adaptive-streaming rendition.
- Client feedback timestamps are read directly from the video player; clients do not type them manually.
- A second moving watermark overlays the player to discourage casual reuse.

The watermark and segmented stream are deterrents, **not copy protection**: a client can still screen-record visible playback, and an authorized review link can be shared. Do not upload material that requires guaranteed prevention of copying.

## 7. Testing limitations

The integration needs a real Cloudinary Free account, secrets, and a cross-device smoke test before it can be considered operational. Test a short, non-sensitive video first; confirm that the HLS rendition plays, comments capture and seek to the right timestamps, and deletion removes the stored review copy. Never paste private keys or secrets into chat or source code.
