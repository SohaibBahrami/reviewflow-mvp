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

### Why Stream instead of raw R2 for video

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
