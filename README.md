# ReviewFlow — MVP

ReviewFlow is a small client-approval tool for freelance video editors.

The first milestone is intentionally local-first:

1. Create a project.
2. Optionally select a video file.
3. Open a review screen.
4. Leave timestamped comments.
5. Resolve comments.
6. Approve a version.

Nothing is uploaded to a server yet. This is deliberate: we want to validate the workflow before paying for infrastructure or adding account complexity.

## Stack

- React 19
- TypeScript 7
- Vite 8
- Plain CSS (no UI framework yet)

The Vite/Tailwind ecosystem is excellent, but this MVP deliberately avoids a styling framework so the first install is small and the UI is predictable. Later we can introduce a component library once the interaction model stabilizes.

## Run locally

```bash
npm install
npm run dev
```

Build a production bundle:

```bash
npm run build
```

Preview the production bundle:

```bash
npm run preview
```

## Product direction

### Phase 1 — Validate the workflow

Local browser prototype: projects, video review, timestamped comments, approval.

### Phase 2 — Real accounts and cloud files

- Supabase Auth + Postgres + Realtime
- Cloudflare R2 for video objects
- Server-generated presigned upload URLs
- Shareable review links

Supabase officially documents the React/Vite setup and publishable-key environment variables. Cloudflare R2 supports browser-friendly direct uploads through server-generated presigned URLs.

### Phase 3 — Paid product

- Client reminder emails
- Revision checklist generated from comments
- Custom branding
- Storage limits
- Stripe/subscription layer where legally and operationally appropriate

## Product thesis

We are not trying to beat enterprise review suites feature-for-feature. The target customer is a solo editor who wants one calm workflow:

> Upload → send link → get timestamped feedback → resolve → approve → deliver.

## AI-assisted experiment

This project is also an experiment in building and shipping software with free AI tools. The primary coding and product-development work in this repository was generated with **GPT-5.6 Luna**. The human developer directs the product, reviews the generated work, runs the application, and reports bugs for iteration.

The goal is to document what can realistically be built this way, including mistakes, debugging, architecture changes, and trade-offs.

## Development log

See [`docs/BUILD_LOG.md`](docs/BUILD_LOG.md).


Current cloud milestone: authenticated editor project metadata and feedback can sync through Supabase after the database setup is applied. Video files still live in the browser's IndexedDB; public client review links do not yet work across devices. See [Supabase setup](docs/SUPABASE_SETUP.md) for the current scope and limitations.
