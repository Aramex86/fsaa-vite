# Changelog — fsaa-vite (plain React template)

All notable changes. Format: Keep a Changelog; versioning: SemVer.

## 0.1.0 — 2026-10-17

### Added
- FSAA layer structure for plain React SPAs: `src/app` (providers + router wiring), `src/pages` (react-router, thin compositions), `src/features`, `src/entities`, `src/shared/ui` — identical layers to the Next.js template, only the pages layer differs
- ESLint flat config enforcing layer boundaries: imports flow down only, features never import each other (the graduation guarantee), `import/no-cycle`
- Projects/Orders canonical example: generic `DataTable` molecule in shared, business columns in features, mocked entity data access
- Dark UI theme mirroring the FSAA docs site: topbar with tri-bar brand, status pills, chiplists, zebra tables
- CI: typecheck + lint on every PR and every push to main