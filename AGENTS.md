# Repository Guidelines

## Project Structure & Module Organization
- Root
  - `nextjs-portal/` – Next.js 14 (App Router) frontend in TypeScript.
  - `functions/` – Firebase Cloud Functions (if enabled in deployment).
  - `public/` – Static assets (served from `/`).
  - `start.bat`, `start.ps1` – Local launcher scripts (Windows).
- App layout (nextjs-portal)
  - Pages/Routes: `src/app/**` (e.g., `/cleaning`, `/manuals`).
  - Features: `src/features/**` (components, services, types per domain).
  - Shared UI: `src/components/**`; Utilities: `src/lib/**`.
  - Tests: colocated or `__tests__` using `*.test.ts(x)`.

## Build, Test, and Development Commands
- Local dev (HMR)
  - `cd nextjs-portal && npm run dev`
  - Or root: `start.bat` (defaults to dev) / `start.bat prod`.
- Build & start (prod)
  - `npm run build && npm run start`
- Quality
  - Lint: `npm run lint`
  - Test: `npm test`

## Coding Style & Naming Conventions
- TypeScript, React (Server/Client Components).
- Indentation: 2 spaces; keep lines concise.
- Naming: `PascalCase` (components/types), `camelCase` (vars/functions), `kebab-case.ts(x)` (files).
- Styling: Tailwind v4 utilities; keep semantic class groups consistent.
- Linting: ESLint (fix warnings where feasible before PR).

## Testing Guidelines
- Frameworks: Jest + Testing Library.
- Place tests near code or under `__tests__/`.
- Names: `ComponentName.test.tsx`, `hookName.test.ts`.
- Run locally: `npm test` (add focused, fast tests for changed logic).

## Commit & Pull Request Guidelines
- Commits: imperative, scoped messages (e.g., `feat(cleaning): add neon badges`).
- PRs must include: description, motivation, screenshots/GIFs for UI, linked issues, and notes on breaking changes/migrations.
- Keep diffs minimal; follow existing patterns in `src/app/**` and `src/features/**`.

## Security & Configuration Tips
- Do not commit secrets. Use `nextjs-portal/.env.local` for Firebase client vars.
- Session/cookies live under `src/app/api/**` and `src/lib/**`; avoid logging sensitive fields.

## Agent-Specific Instructions
- Prefer targeted edits; do not reformat unrelated files.
- Co-locate `components`, `services`, and `types.ts` within each feature folder.
- Validate with `npm run build` and `npm run lint` before handing off.
