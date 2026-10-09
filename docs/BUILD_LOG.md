# Build log

## 2026-10-08 — Project reset and MVP architecture

### Why we changed direction

The earlier project was too broad and spent too much effort on landing-page polish and framework troubleshooting. The new goal is much smaller: prove that a freelancer/client review flow is useful before building billing, accounts, mobile apps, or expensive infrastructure.

### Decision

Use Vite + React + TypeScript for the first web application. Avoid Next.js for this MVP. Use plain CSS instead of Tailwind initially. Keep the dependency surface small.

### Current workflow

- Dashboard with projects
- Create project
- Optional local video selection
- Video review screen
- Timestamped comments
- Comment resolve/reopen
- Version approval
- Local persistence with `localStorage`

### Deliberately not built yet

- Authentication
- Cloud storage
- Public share links
- Email notifications
- Payments
- AI features
- Android/iOS app

Those are phase-two/three decisions. We should not build them until the review workflow feels good.

### Infrastructure target

When we move past validation:

```text
React/Vite web app
       |
       +---- Supabase Auth/Postgres/Realtime
       |
       +---- Cloudflare R2 video storage
       |
       +---- small server/worker for signed upload URLs
```

### First product test

A freelancer should be able to create a project and receive useful client feedback without explaining the product to the client.

## AI experimentation

This project is being built as an experiment in creating and shipping a useful product with free AI tools. The primary coding and product-development work in this repository was generated with **GPT-5.6 Luna**, with the human developer directing the product decisions, reviewing results, running the application, and reporting bugs.

The repository intentionally documents this process so the experiment is reproducible and transparent about the role of AI in development.

## 2026-10-08 — Theme system and two-sided review workflow

### Theme

- Dark mode remains the default.
- The initial theme is chosen from a saved user preference when available, otherwise from the browser's `prefers-color-scheme` setting.
- The choice is stored in `localStorage` so it survives reloads.
- An inline theme bootstrap in `index.html` applies the theme before the React app loads, preventing the light-mode flash seen in the earlier project.
- Added a light/dark toggle and a ReviewFlow favicon using the product mark.

### Review workflow milestone

The local prototype now has both sides of the core workflow:

```text
Editor creates project
        ↓
Editor reviews + resolves comments
        ↓
Editor opens client preview / copies client link
        ↓
Client watches + leaves timestamped feedback
        ↓
Client approves the version
        ↓
Editor can create the next version
```

`New version` increments the version number and returns the project to `in_review`. Previous comments are now kept in a read-only history scoped to their version. The local prototype still uses the same browser-only video object; storing a separate video file for each version remains a future step.

### Validation note

The implementation was checked at the source level in this environment. A full `npm install` did not complete within the available execution window, so a fresh production build was not claimed as verified here.


## 2026-10-08 — Product UX clarification pass

### Problem

The core workflow worked, but several screens still used product-development language instead of language a first-time client or editor would naturally understand. The client preview also exposed editor navigation, and the local prototype's copied URL could sound like a real public share link.

### Decision

Make the interface task-oriented and self-explanatory without adding a tutorial. Use short guidance directly where the user needs it, make editor/client roles visually distinct, and describe prototype limitations honestly.

### Changes

- Renamed navigation to `Projects` and `Create project`.
- Rewrote dashboard copy and project cards around the user's actual tasks.
- Added a clearer empty state.
- Added field-level help when creating a project.
- Added three-step workflow guidance to editor and client review screens.
- Removed editor-only navigation from client preview mode.
- Renamed review actions to describe their outcome.
- Clarified that the copied preview URL is local-only in the current prototype.
- Added an explicit `Client review` indicator in client mode.

### Branching

This milestone was developed on `feature/clarify-product-ux` with separate commits, then merged back into `main`. This is the first milestone using the repository's branch workflow.


## 2026-10-08 — Review links

Added stable per-project review tokens and a standalone client-review route. The editor can now copy a review link that opens directly in the client experience. The prototype still stores data locally, so the link only resolves in the same browser; cloud persistence and cross-device sharing are the next backend milestone.


## 2026-10-08 — Video review controls and feedback positioning

### Problem

The browser-native video controls were functional but visually inconsistent with the product, the upload field looked like an unstyled browser control, and the live feedback timestamp sat on top of the video controls.

### Decision

Keep the browser's native HTML5 video playback engine, but build a small custom control bar around it rather than introducing a heavyweight video-player dependency. Move the current feedback timestamp into the comment composer so it never covers the video's timeline.

### Changes

- Added lightweight play/pause, ±5 second seek, progress, volume, and fullscreen controls.
- Kept `preload=metadata` and the native `<video>` element for efficient playback.
- Replaced the browser-default file input with a styled video picker and selected-file state.
- Removed the timestamp overlay from the video.
- Added a dedicated `Feedback time` indicator beside the feedback action.

### Validation note

`git diff --check` passed. A fresh dependency install timed out in the execution environment, so a production build was not claimed as verified.

### Dependency choice

This milestone adds no runtime dependency. The custom video controls use the browser's existing HTML5 media APIs so playback stays lightweight.


## 2026-10-08 — Video control polish and media protection decision

### Video controls

- Reworked the volume control to remove the confusing glyph and use an explicit `Mute` / `Unmute` action.
- Replaced browser-dependent range styling with a controlled slider so the thumb reaches the full track.
- Made the review timestamp visually prominent with `Will submit at 00:14`, making it obvious that the current video time is the timestamp attached to the submitted feedback.
- Kept the player lightweight: native HTML5 playback, no new runtime dependency.
- Added browser-level download/remote-playback restrictions and disabled the player context menu as deterrents. These are UX/security layers, not absolute content protection.

### Media protection decision

The prototype exposed a local video directly to the browser. That is acceptable for local testing but not for a paid review product where the uploaded work may be confidential.

For the production video path, the architecture now favors Cloudflare Stream over raw MP4 delivery from R2. Stream provides encoding, HLS/DASH playback, signed tokens, allowed origins, and optional watermarking. The application will use short-lived signed playback tokens for review links and will not grant download access by default.

The product cannot guarantee that a viewer cannot screen-record a video once it is visible on their device. The practical protection strategy is to remove easy download paths, keep source URLs non-public, expire access, restrict the playback origin, and add client-specific visible watermarking so unauthorized recordings are attributable.


## 2026-10-08 — Video protection architecture decision

The product needs stronger protection than a browser-level “download disabled” control. Raw MP4 delivery means the authorized browser receives the actual media data, so UI restrictions cannot turn it into DRM.

We will keep two viable options documented:

- **Managed path:** Cloudflare Stream for encoding, HLS/DASH delivery, signed playback tokens, origin restrictions, and optional watermarking.
- **DIY path:** private R2 originals + our own transcoding to HLS + an authenticated Worker that serves short-lived playlist/segment access.

The DIY path gives us more control but also makes us responsible for transcoding jobs, retries, compatibility, cleanup, and scaling. The managed path is likely the better production choice unless the added control of the DIY stack becomes economically or technically worthwhile.

In either design, the product claim is “prevent casual downloading and unauthorized sharing,” not “make screen recording impossible.”

## 2026-10-08 — Repository integrity repair

The project archives previously included Git refs without the corresponding Git object database, which made the local repository appear to have branches pointing at missing commits. The project was rebuilt into a valid Git repository with the current application snapshot and a structured commit history preserved as real Git objects.

Future project archives will be validated with `git fsck --full` before delivery.
### 2026-10-08 — Browser-local video persistence
- Found that project metadata survived refresh while uploaded videos did not.
- Root cause: the MVP stored temporary `blob:` URLs only in memory and explicitly removed them before writing project metadata to `localStorage`.
- Replaced that approach with native IndexedDB for browser-local video blobs.
- Project metadata now stores a stable local video ID, while the app recreates a fresh object URL on load.
- No dependency added; this uses browser storage APIs directly.
- Existing videos created before this change cannot be recovered after a refresh because their temporary URLs were never persisted.


## 2026-10-08 — Reliability and project lifecycle

### Reliability

A browser hang was reported while working with local videos. The important root cause was not a missing error message: the app was hydrating every saved video at startup and could load multiple large blobs into memory at once.

Changes:

- Local videos are now loaded only when the user opens a project/review that needs the video.
- Added an application error boundary with a clear reload/recovery screen.
- Added recoverable notices for storage failures and browser-level runtime errors.
- Added an inline video playback error state with a retry action.
- Added handling around local video restoration failures.

This does not claim to catch a browser-level `RESULT_CODE_HUNG` after the browser process has actually become unresponsive; the primary fix is reducing the work that could cause the hang in the first place.

### Project lifecycle

Projects now have three lifecycle states:

```text
in review → approved → completed
                    ↘ reopen → in review
```

- Completed projects are separated into an archive section on the dashboard.
- Editors can mark a project complete or reopen it.
- Editors can delete projects; local video data is deleted from IndexedDB as part of the same action when possible.
- Completed client reviews become read-only.
- Starting a new version reopens a completed project automatically.

No dependency was added for this milestone.

## 2026-10-08 — Project trash and undo

### Decision

Deletion is now reversible by default. The editor moves projects to Trash instead of immediately destroying them. A short-lived Undo action covers accidental clicks, while Trash provides a deliberate recovery place for older deletions.

### Changes

- Replaced the browser's native delete confirmation with a ReviewFlow confirmation dialog.
- Deleting a project moves it to `trashed` instead of immediately removing it.
- Added an eight-second Undo action after moving a project to Trash.
- Added a dedicated Trash area in the main navigation with a trash-can icon and count.
- Added Restore project for deleted projects.
- Added a separate permanent-delete confirmation that removes the project and its browser-local video.
- Keep active object URLs valid while a project is in Trash so Undo/Restore preserves playback; revoke URLs only after permanent deletion.
- Prevented trashed projects from resolving through their review links.
- Kept completed projects separate from Trash.

### Dependency choice

No runtime dependency was added. Confirmation, toast, timers, and the Trash view are implemented with React and browser APIs already in the project.

## 2026-10-08 — Supabase cloud foundation

### Decision

Start the cloud migration with identity and database authorization, while leaving browser-local project/video storage as the fallback until the cloud path is configured and tested.

### Changes

- Added the official `@supabase/supabase-js` client library as the only new runtime dependency in this milestone.
- Load the Supabase client lazily so local mode does not eagerly load the cloud SDK.
- Added an Account screen with email/password sign-up, sign-in, persistent sessions, and sign-out.
- Added a Supabase SQL schema for projects, project versions, and review comments.
- Enabled Row Level Security and owner-only editor policies in the schema.
- Intentionally did not grant anonymous access to the projects table; public client reviews will use a narrower server-side/share-link path later.
- Kept local storage active so the app remains usable before a Supabase project is configured.

### Next migration step

After the account foundation is configured and tested, migrate editor project metadata and review comments to Supabase while keeping video objects out of Postgres.


## 2026-10-09 — Project creation and deletion audit

### Findings and fixes

- Project names and client names are required; whitespace-only values are rejected and no placeholder project is silently created. A follow-up form audit made video upload mandatory for project creation.
- Removed Move to Trash from dashboard cards. Projects can be moved to Trash only from the editor review screen; permanent deletion remains available in Trash.
- Dashboard active-work filters now exclude trashed projects, which fixes the main reason a deleted project appeared to remain active.
- Enforced the three-project Trash limit in both the initial delete action and confirmation handler. When Trash is full, ReviewFlow takes the user to Trash and explains how to make room.
- Kept local video object URLs alive while an item is in Trash so Undo/Restore preserves playback.
- If deleting a stored video fails, the project remains in Trash rather than losing its metadata and leaving an orphaned video in IndexedDB.
- Failed/cancelled video restoration can be retried when the project is opened again.

### Tests

Added focused Node built-in tests for required project details, Trash counts, and the exact three-item Trash limit. No test framework or runtime dependency was added.


## 2026-10-09 — Required video and form validation follow-up

### Changes

- Project creation now requires a selected video. Missing-video errors are translated in English, French, Spanish, German, and Portuguese.
- The project form uses its own validation path so missing required fields produce the app's translated error instead of relying only on browser-native validation.
- The editor-side Add feedback button is disabled until the comment contains non-whitespace text; the textarea is marked required. The client-side form already had the corresponding guard.
- No dependencies were added.

### Verification

- `node --test`: 14 tests passed.
- `git diff --check`: passed.
- `npm run build` was attempted, but this verification checkout has no installed React, Supabase, or Vite packages. The full production build therefore remains unverified here and must be run after dependencies are installed.


## 2026-10-09 — Compact language picker and competitive UX review

### Language picker

- Replaced long visible language names with a compact SVG flag plus two-letter code in the top bar. The opened language menu shows vector flags, native language names, and locale codes; it supports keyboard focus and Escape to close.
- Rendered United Kingdom, France, Spain, Germany, and Portugal flags as inline SVG, avoiding emoji-font rendering issues and additional dependencies.

### Competitive UX review

Reviewed publicly available feature pages and support material from Frame.io, Wipster, and Ziflow. Patterns worth considering for ReviewFlow:

- Keep timestamped comments beside the video and make the associated moment easy to revisit.
- Make open/resolved feedback and approval state obvious at a glance.
- Preserve feedback against the exact video version rather than clearing it when a new version starts; this is now implemented in the local prototype.
- Keep client review low-friction, while adding share-link controls such as expiry, password protection, and download permissions when real cloud sharing is implemented.
- Prioritize a responsive review screen and a compact dashboard over enterprise-style team, campaign, and integration features.

These are roadmap recommendations, not claims that every competitor feature is implemented in this prototype. Security controls on review links should be enforced by the eventual server/storage layer, not only by the client UI.

### References reviewed

- Frame.io V4 — Shares and review-link settings: https://help.frame.io/en/articles/9105232-shares-in-frame-io
- Wipster — product features: https://www.wipster.io/product
- Ziflow — video production workflow: https://www.ziflow.com/use-cases/video-production-software
- Ziflow — video/audio review controls: https://help.ziflow.com/hc/en-us/articles/30725236648212-Review-video-and-audio-proofs

### Verification

- `npm test`: 15 tests passed after the SVG flag/dropdown fix.
- `git diff --check`: passed.
- `npm run build`: attempted, but blocked because React, Supabase, and Vite are not installed in this verification checkout; the production build remains unverified here.


## 2026-10-09 — Version-specific feedback history

- Starting a new version now archives the previous version's status and comments instead of discarding them.
- Current-version feedback starts empty, preventing comments from an older version's timestamps from appearing on the new review.
- Editor view includes a compact, collapsed-by-default history for previous versions and their feedback. Client preview continues to expose only current-version feedback.
- Existing locally saved projects are migrated in place by defaulting missing `versionHistory` fields to an empty array.
- No new dependencies.

### Verification

- `node --test`: 16 tests passed.
- `git diff --check`: passed.
- Added regression coverage for archive preservation, current-version separation, status reset, and source immutability.
- `npm run build` remains unverified here because this checkout does not have React, Supabase, or Vite installed.
