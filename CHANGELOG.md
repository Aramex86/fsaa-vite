## 0.2.0 — 2026-10-21

### Added

- `AGENTS.md` machine contract: pnpm command contracts + single-lockfile rule, FSAA layer placement rules (pages/router variant), import boundaries, PR-flow rule — every rule carries a `<!--check: id-->` marker verified by CI
- `scripts/check-agents-md.mjs` (v4.2-vite) — drift-check: two-way binding, real import-boundary scan, UI fetch-free scan, colored per-rule report
- CI workflow `agents-md-drift-check`: runs the drift-check on every PR and push
