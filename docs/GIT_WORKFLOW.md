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


## Branch workflow

Use branches when a change is large enough to review independently, especially a user-facing feature or a meaningful refactor.

Recommended pattern:

```text
main
  └── feature/clarify-product-ux
        ├── small focused commits
        └── merge back to main
```

Branch naming:

- `feature/...` for user-facing work
- `fix/...` for bug fixes
- `refactor/...` for internal restructuring
- `docs/...` for documentation-only work

Keep commits small and understandable. Merge a feature branch with a merge commit when the branch represents a complete milestone, so the public history shows where a feature started and ended.
