# Architecture

## Phase 1

Everything is local:

```text
React UI
  |
  +-- localStorage: projects/comments/status
  |
  +-- browser File API: optional local video preview
```

This keeps the prototype cheap, fast, and safe to experiment with.

## Phase 2

```text
Browser
  |
  +-- Supabase Auth
  |      |
  |      +-- Postgres (projects, comments, versions, memberships)
  |      +-- Realtime (new comments / status changes)
  |
  +-- Cloudflare Worker / app API
         |
         +-- one-time / short-lived upload authorization
         |          |
         |          +-- Cloudflare Stream
         |                 +-- encoding
         |                 +-- HLS / DASH delivery
         |                 +-- signed playback tokens
         |                 +-- origin restrictions
         |                 +-- optional watermarks
         |
         +-- signed playback token for client review
```

### DIY secure video alternative

We can build the delivery layer ourselves instead of using a managed video service, but the important distinction is that **private MP4 + a signed URL is access control, not download prevention**. R2 presigned URLs intentionally grant whoever has the URL temporary access to the object.

A self-built review path would look like this:

```text
Editor
  |
  +-- private original MP4 -> R2
  |
  +-- transcoding job -> HLS renditions + segments
                            |
                            +-- encrypted segments
                            +-- short-lived manifest/token
                                      |
                                      v
Client review player <- authenticated Worker
```

The Worker would authorize the review link and issue short-lived access to the playlist and media segments. We would never expose the R2 credentials or permanent public object URL to the browser. HLS/DASH and encrypted-media technologies can support more controlled playback, but they do not make the visible video impossible to copy or record. Browser DRM is a significantly more complex layer and should only be considered if customers actually need it.

The trade-off is engineering complexity: **R2 + Worker + our own transcoding pipeline** gives us control and can be inexpensive at low volume, but we would own encoding, retries, storage cleanup, playback compatibility, and scaling. Cloudflare Stream removes most of that operational work while providing signed playback tokens and download restrictions.

## Why Stream instead of raw R2 for video

R2 remains useful for ordinary file storage, but raw MP4 delivery is the wrong foundation for a review product where the video is valuable intellectual property. Cloudflare Stream handles video encoding and adaptive playback and supports HLS/DASH, while signed tokens can require authorization for playback. This lets the app avoid exposing a permanent public MP4 URL.

Cloudflare's current Stream documentation also supports origin restrictions and watermarking. The default short-lived token does not enable download access; explicit `downloadable` access is an opt-in token restriction.

A browser can never make watched pixels impossible to record. Our goal is therefore to prevent casual downloading, avoid public source URLs, limit access duration, tie access to the intended review link/session, and add a visible client-specific watermark as a deterrent. Strong DRM can remain a later enterprise-level option if customers actually require it.

## Database shape for phase 2

### projects

- id
- owner_id
- client_name
- title
- status
- created_at

### versions

- id
- project_id
- version_number
- object_key
- duration_seconds
- created_at

### comments

- id
- version_id
- author_id or guest_token
- timestamp_seconds
- body
- status
- created_at

### approvals

- id
- version_id
- approver_name
- approved_at

## Security principles

- never expose R2 access keys to browser clients
- review links should use unguessable tokens
- use Supabase Row Level Security for authenticated application data
- keep client uploads isolated by project/version identifiers
- validate upload type and size before issuing upload authorization
- never expose Cloudflare API credentials to the browser
- issue short-lived playback tokens and keep video identifiers out of public URLs where possible
- do not grant `downloadable` playback access for review links
