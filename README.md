# ArzDesk

**Your clients. Your projects. A clearer working day.**

An open-source, multi-tenant business workspace for small teams and freelancers, built by ArzCore Technologies.

Version **0.6.1** adds a complete local workspace mode at `/offline`: use clients, projects and tasks without a login or network connection, after the initial shell download. Read the [offline guide](docs/offline.ar.md) and [release notes](docs/releases/v0.6.1.md). Shared online accounts remain available; local changes do not automatically sync.

## Device workspaces

The root address and legacy `/start` launch device mode; `/cloud` opens online accounts. Local navigation uses native hash links without server router requests. Open `/offline` online once and wait for **Ready for offline use** before disconnecting. Multiple workspaces, client/project/task CRUD, filters, statuses, dashboard counts and workspace renaming use IndexedDB transactions on the device. Export JSON backups and import them as additional workspaces without replacing existing records. **Copy online workspaces** requires a signed-in online session and makes independent local copies; it never uploads local changes. Devices and browser profiles have separate stores. Clearing site storage or losing the device can erase local work; keep exported backups. Team sharing and authentication require internet. EXE/APK packaging and automatic synchronization are not included.

The service worker precaches only the public `/offline` shell, local fonts, product images and build assets. It never caches account pages, authenticated snapshots or API responses. `npm run build` generates the versioned asset list after Next.js finishes; serve the resulting app over HTTPS (or localhost for development).

## What’s included

- Email/password sign-up, sign-in, persistent sessions and sign-out with Better Auth.
- Multiple organizations per account, an owner created atomically with every organization, and a workspace switcher.
- Owner, admin, member and viewer roles, checked on the server for every operation.
- Private, email-bound invitation links, valid for seven days; accept, revoke and reissue flows.
- Client CRUD, project CRUD and task CRUD, with search, statuses, priority and optional due dates.
- Live dashboard counts derived from the current organization’s persisted records. No fabricated metrics.
- Read-only viewer UI, member role changes/removal by the owner, and immediate membership checks.
- Guided first-use setup, context-aware client/project/task links, inline task updates and a built-in quick guide.
- Focused forms with optional details, explicit labels, status colors and clear action buttons.
- Responsive desktop tables, phone/tablet record cards, touch controls and scrollable dialogs; a dedicated ArzDesk identity, with ArzCore attribution.
- Versioned SQL migrations, Docker Compose, Vitest database/auth tests, Playwright user-flow tests and GitHub Actions.

## Stack

| Layer                | Technology                                                       |
| -------------------- | ---------------------------------------------------------------- |
| App                  | Next.js App Router, React, TypeScript                            |
| UI                   | Tailwind CSS 4, shadcn/ui-style local Button, Radix Slot, Lucide |
| Server               | Server Components, Server Actions, Better Auth route handler     |
| Database             | PostgreSQL, Drizzle ORM and Drizzle Kit                          |
| Validation           | Zod                                                              |
| Verification         | Vitest, PGlite, Playwright, ESLint, TypeScript                   |
| Local infrastructure | Docker Compose, Node.js 24                                       |

Dependencies are pinned in `package-lock.json`. Use **Node.js 24 LTS** and npm. PostgreSQL 17 is the Compose/CI database.

## Run locally

1. Download/extract the source, or clone your GitHub repository once published. Open a terminal in the project folder.
2. Install dependencies:

   ```sh
   npm ci
   ```

3. Copy the environment template:

   ```sh
   cp .env.example .env
   ```

   On Windows PowerShell use `Copy-Item .env.example .env` instead.

4. Generate a secret, then put the output in `.env` as `BETTER_AUTH_SECRET`:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Keep `BETTER_AUTH_URL=http://localhost:3000`. The example `DATABASE_URL` connects to the local Compose database. Never commit `.env`.

5. Start PostgreSQL and apply the checked-in migrations:

   ```sh
   docker compose up -d db
   npm run db:migrate
   ```

   Without Docker, use an existing PostgreSQL database and replace `DATABASE_URL` in `.env` before migrating.

6. Start the app:

   ```sh
   npm run dev
   ```

Open **http://localhost:3000**, create your own account, then create a workspace. Add a client → project → task. There are no default accounts or seeded passwords.

### Optional demo data

After registering an account, create a new workspace with fictional portfolio data:

```sh
npm run db:seed -- your-registered-email@example.com
```

This uses the regular service layer and creates a separate demo workspace. It never deletes existing work.

### Run the whole local stack with Docker

After preparing `.env` and replacing the secret:

```sh
docker compose up --build
```

Compose starts PostgreSQL, applies migrations in a one-shot tooling container, then starts the production-mode Next.js server at http://localhost:3000. This is a local setup; configure HTTPS, private networking, unique database credentials, backups and trusted proxy/IP handling for an internet-facing deployment. Image builds do not need a database or authentication secret; runtime does.

`docker compose down` stops the stack and keeps the database volume. Avoid `down -v` unless you intend to delete the local database.

## Install on a device

Open `/download` for Windows 10/11 EXE installers, Apple Silicon and Intel Mac DMGs, and in-page Android/iPhone/iPad PWA installation. Desktop local work runs offline; phone PWAs need an initial online visit to prepare offline access. Local workspaces stay separate on each device and can be moved using export/import backups. Online accounts and shared workspaces require a connection and the hosted backend. Android APK and native App Store releases are not available yet. Account pages and API responses are never stored in the service-worker cache.

Production needs a reachable PostgreSQL database, unique authentication secret, canonical HTTPS URL and configured SMTP for password recovery. A private GitHub repository keeps source private; configure deployment access separately. See [hosting setup](docs/install-and-host.ar.md).

## Team invitations

Open **Team & settings → Invite member**. Enter an email and role, copy the generated link, and share it privately with the intended person. They sign up/sign in using that same email and accept it.

v0.1.0 deliberately uses manual link sharing. It does **not** send email. The raw token is shown once and is not stored in the database; reissue a lost invitation to create a new link and invalidate earlier links.

## Roles

| Action                                     | Owner | Admin | Member | Viewer |
| ------------------------------------------ | :---: | :---: | :----: | :----: |
| Read workspace data                        |   ✓   |   ✓   |   ✓    |   ✓    |
| Create/update clients, projects, tasks     |   ✓   |   ✓   |   ✓    |   —    |
| Delete clients, projects, tasks            |   ✓   |   ✓   |   —    |   —    |
| Invite/revoke member or viewer invitations |   ✓   |   ✓   |   —    |   —    |
| Invite/revoke admin invitations            |   ✓   |   —   |   —    |   —    |
| Change roles/remove members                |   ✓   |   —   |   —    |   —    |

The owner cannot be demoted or removed in this version. There is no ownership transfer or organization deletion UI yet.

## Check the project

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs the committed migrations and service/auth tests against isolated in-process PostgreSQL (PGlite), with no Docker dependency. `npm run test:coverage` reports service/policy/validation coverage.

For browser tests, use a **dedicated disposable database** in `.env`, migrate it, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser suite creates test users and workspaces. Do not point it at a real user database. CI provisions a PostgreSQL service and runs it automatically. An optional `TEST_DATABASE_URL` runs the service/auth suite against a dedicated PostgreSQL database instead of PGlite; that database is truncated by the tests.

## Repository layout

```text
src/
  app/                  # App Router pages, auth route handler, boundaries
  components/           # Brand, sign-out and local UI primitives
  features/
    auth/               # Sign-in/sign-up UI
    workspace/          # Validation, RBAC, tenant-scoped service, actions, UI
  lib/
    db/                 # Drizzle schema and PostgreSQL pool
    auth.ts             # Lazy Better Auth configuration
    session.ts          # Server-side session check
  types/                # Shared types as the project grows
scripts/                # Migration and opt-in demo seeding
drizzle/migrations/     # Generated, checked-in SQL + journal
tests/                  # Database/auth tests and browser user flows
docs/                   # Architecture, roadmap, verification, release notes
.github/                # CI, issue forms and PR template
```

Read [architecture](docs/architecture.md), [roadmap](docs/roadmap.md), [contributing](CONTRIBUTING.md), [security](SECURITY.md), [Arabic setup guide](docs/getting-started.ar.md) and [publishing instructions](docs/publishing.md).

## Developer

**ArzCore Technologies**

## License

[MIT](LICENSE) · ArzCore Technologies

## Password recovery email

The sign-in page links to Forgot password. Reset links expire after 15 minutes, work once and invalidate existing sessions after a successful reset.

During `npm run dev`, with the default `MAIL_MODE=auto` and no SMTP host, links are printed in the private server terminal. For delivery to real inboxes, configure `MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM` in `.env`, using your provider’s settings. Port 465 uses `SMTP_SECURE=true`; port 587 normally uses `false` with STARTTLS. Restart the server after changes. Never share credentials or reset links.

Production does not print reset links. Without SMTP configuration, the recovery page explains that email is unavailable. Sending was verified with a local SMTP capture, not an external email provider.

## Included fonts and artwork

Inter and Cairo are self-hosted WOFF2 variable fonts, licensed under the SIL Open Font License; their notices are in `src/app/fonts`. Browsing and building the app do not fetch fonts from Google. The company icon is copied byte-for-byte from the current ArzCore website; the same PNG is used for branding and browser/Apple icons.

## Profile and account changes

Open Profile using your name or the account icon. Name changes save directly. Email changes use Better Auth confirmation: your current login address stays active until the new address is verified; a previously verified current address must approve first. Confirmation links use the same SMTP/development-terminal delivery as recovery. Without delivery configured in production, the form explains the missing setup and disables sending. Password changes require the current password and revoke other sessions while keeping this browser signed in. Logout awaits server confirmation and performs one navigation to sign-in.

Workspace sections share a persistent layout. Navigation stays visible while page data loads; route-level skeletons replace the old full-screen workspace-loading message. Development compilation can still delay a first visit. No instant-network or hosting performance guarantee is implied.
