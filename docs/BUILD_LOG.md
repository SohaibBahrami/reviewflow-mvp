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

`New version` currently increments the version number, returns the project to `in_review`, and clears the previous version's comments. The local prototype still uses the same browser-only video object; cloud versioned storage comes later with R2.

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
