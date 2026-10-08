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
  +-- app API / worker
         |
         +-- signed R2 upload URL
                    |
                    +-- Cloudflare R2 (video objects)
```

Browser clients should upload directly to R2 through a short-lived presigned URL so the application server does not become a video proxy. Cloudflare's current R2 documentation recommends this pattern for client-side uploads.

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
- keep client uploads isolated by project/version object keys
- validate upload type and size before issuing signed URLs
