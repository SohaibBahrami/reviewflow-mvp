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
