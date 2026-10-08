# Git workflow

The goal is to document the product as it is built.

Recommended commit style:

- `feat: add timestamped comments`
- `feat: add project approval`
- `fix: prevent comment loss`
- `docs: record architecture decision`
- `refactor: simplify review page`

Each meaningful feature should be accompanied by a short update in `docs/BUILD_LOG.md` describing:

1. the problem
2. the decision
3. what changed
4. what remains unknown

This makes the repository a public build diary as well as a codebase.
