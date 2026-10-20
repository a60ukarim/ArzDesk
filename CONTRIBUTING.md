# Contributing to ArzDesk

Thanks for helping make small-team work clearer. Read the README and architecture notes before changing the application.

## Workflow

1. Use Node.js 24, `npm ci`, a local PostgreSQL database and `.env` copied from `.env.example`.
2. Create a focused branch for one issue or feature.
3. Keep domain validation and authorization in the service layer. Never trust a submitted user ID or role.
4. Every business query must be scoped to an organization. Preserve composite foreign keys and transactional membership checks.
5. For schema changes, run `npm run db:generate`, commit the generated SQL/journal, and test the migration. Do not rewrite previously released migrations.
6. Run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. For UI/auth changes, run `npm run test:e2e` against a disposable database.
7. Open a PR describing the problem, resulting behavior and validation. Include screenshots for visible UI changes if appropriate.

## Style and tests

Use TypeScript, small feature boundaries and accessible controls. Prefer a clear implementation over speculative abstractions. Tests should exercise security boundaries and user behavior, including failed authorization, not merely mirror individual functions.

Do not commit secrets, generated build folders, user exports or `node_modules`. Do not introduce external paid services without documenting setup and keeping local development usable.

By contributing you agree your contributions are licensed under the MIT license.
