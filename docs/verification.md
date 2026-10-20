# v0.4.0 verification

Verified on 20 October 2026 (Asia/Beirut), using Node.js 24.19.0.

- ESLint, strict TypeScript and a clean production build passed.
- All 28 service/auth tests passed. The new account test proves an already verified email remains unchanged until the old address approves and the new address confirms; an anonymous change request is rejected.
- The full workspace story, SMTP-captured recovery and direct cedar Light/Dark stories passed. The authenticated sweep covers six sections at 11 widths (320–1920px) in both appearances. The broad layout sweep requests reduced motion; a separate test exercises the cedar animation state and saved selection. No System menu is present.
- The final targeted profile story passed after fixing short-height navigation. It checks that the navigation DOM survives a route change, scrolls a real page at 1440×400 and 390×400 while keeping section links visible, persists an Arabic name after reload, follows the actual SMTP-captured email-change link, rejects a wrong current password, changes the password, revokes another browser session, logs out, then signs in with the new email/password. Profile bounds are checked at 320, 768 and 1440px.
- Actual company PNG bytes match the downloaded ArzCore website icon. Browser canvas checks verify transparent corners and the circular rim. Representative auth artwork, dark/mobile screens and profile views were inspected.

## Environment and limits

Production-mode Chromium, viewport emulation, normal pg adapter and an isolated PGlite wire harness were used; its test-only preload limits the pool to one connection. Native PostgreSQL concurrency, physical devices, Safari/Firefox, Docker and hosted CI were not exercised. SMTP capture proves local delivery, not external inbox delivery. Development compilation and network/database latency remain possible. No instant logout/navigation timing guarantee is claimed. No deployment or repository push was made. There are no schema or dependency changes in this release.

---

# v0.3.1 verification

Verified on 20 October 2026 (Asia/Beirut), using Node.js 24.19.0.

- ESLint, strict TypeScript and a clean production build passed.
- All 27 service/auth tests passed.
- Three production Chromium stories passed and cover the full workspace workflow, SMTP-captured password reset, and theme behavior.
- The authenticated sweep checks Overview, Clients, Projects, Tasks, Team and Settings at 11 widths (320–1920px) in both appearances. Theme menus are checked inside the viewport. Representative light/dark phone, tablet and desktop screens were inspected.
- The theme story checks the cedar animation state, persistence after reload and navigation, manual light/dark selection, System following an emulated OS change, keyboard activation and reduced-motion behavior. The auth theme menu is checked at 320, 390, 768 and 1440px.
- The browser verifies the icon's actual rendered transparent corners and light circular rim; app CSS alone cannot repair a favicon. A separate byte check confirms the supplied artwork is unchanged inside the SVG frame. The PNG icon's corner alpha is zero.
- Font families resolve to the bundled Inter/Cairo files; the main story includes a fictional Arabic client name to exercise Arabic rendering.

## Environment and limits

The browser uses Chromium viewport emulation, a real production Next.js server and an isolated PGlite wire-protocol database with a test-only single-connection pg preload. This is not physical-device/Safari/Firefox certification, native PostgreSQL concurrency validation, Docker execution or hosted CI. SMTP delivery is captured locally. Theme preference is local to the browser; it is not synchronized through the account. Service/auth logic, schema and dependency set are unchanged from v0.3.0. No repository push or deployment was made.

---

# v0.3.0 verification

Verified on 19 October 2026 (UTC), using Node.js 24.19.0.

- ESLint, strict TypeScript and a clean production build passed.
- All 27 service/auth tests passed, including owner-only workspace rename, tenant-scoped project status changes, password reset expiry/single use, password validation and old-session invalidation.
- Both production Chromium stories passed (31.8 seconds total). Main story covers signup, workspace rename, Help, client/project/task creation and updates, persistence, invitations, viewer permissions, membership removal and deletion. Recovery story sends through a local SMTP capture, follows the actual emailed link, changes the password, rejects the old password, invalidates the old session and rejects reuse.
- Overview, Clients, Projects, Tasks, Team and Settings were checked at 11 viewport widths from 320 to 1920 pixels. Controls, record cards and document bounds were asserted. Representative login, phone/tablet/desktop overview and task views were inspected visually. Mobile and landscape dialogs were checked.
- Current interface/examples/docs/tests/seeds contain no real customer examples or personal developer credits.

## Limits

Chromium viewport checks do not certify physical devices or Safari/Firefox. Tests use isolated PGlite databases; the production browser server uses the normal pg adapter with a test-only single-connection preload for the PGlite wire harness. Native PostgreSQL concurrency, Docker and hosted CI were not executed here. The SMTP test uses local capture, not an external provider; real inbox delivery requires the operator’s SMTP configuration. No repository push, hosted deployment or GitHub release was made.

---

# v0.2.0 verification

Verified on 20 October 2026 (Asia/Beirut), using Node.js 24.19.0.

- ESLint, strict TypeScript and a clean production build passed.
- The production-mode Chromium browser story passed (19.0 seconds; total run 20.8 seconds).
- Real flow: register, create workspace, read Help, add/edit client, create a project from its client row, open that client’s project list, open a project’s tasks, create a task with its project preselected, change status, reload and verify persistence/counts, invite a viewer, accept invitation, verify viewer restrictions, refuse an invalid project context, remove membership and verify lost access, delete a project and verify task cleanup.
- Clients, Projects, Tasks and Team were checked at widths **320, 360, 390, 600, 768, 820, 1000, 1024, 1280, 1440 and 1920 pixels**. Document overflow, compact record bounds and filter heights were asserted. Representative phone, tablet and desktop renders were inspected visually.
- Task creation dialogs were checked for desktop centering, mobile bounds and landscape scrolling at 844×390. Help opens and closes on desktop and mobile. Optional creation fields stay collapsed, while edit fields remain available.
- The original supplied ArzCore logo was copied without changing its bytes. Product credits contain the company name; account and team names remain actual workspace data.

## Environment and limits

Browser checks use viewport sizes in Chromium, not a physical-device fleet or Firefox/Safari certification. Service/auth coverage remains the 24 passing tests described below; no service/schema/dependency changes were made for v0.2.0. The final browser run used the ordinary production Next.js server and pg adapter with an isolated PGlite wire-protocol database. A test-only preload limited the pool to one connection, matching PGlite’s connection model, after a multiplexed harness run returned inconsistent session field data. The session email assertion remained enabled and passed. No test preload is part of delivered application code.

These checks do not establish native PostgreSQL concurrent behavior. PostgreSQL 17, Docker image execution and hosted CI were not run here. Docker’s runtime copy now includes public assets; that configuration change still requires a Docker-capable environment. No hosted deployment or GitHub release was published.

---

# v0.1.1 verification

Verified on 19 October 2026 in the authoring environment.

- ESLint, strict TypeScript and production build passed.
- All 24 service/auth tests passed, including quick status update authorization, tenant isolation, input validation and preservation of other task fields.
- The complete Playwright user story passed against the production server. It checks direct task status changes and persistence after reload, client/project/task flows, invitation acceptance and revocation, viewer restrictions and developer credits.
- The task dialog is centered on desktop. Desktop and 390px mobile layouts were inspected; navigation remains accessible and the document does not overflow horizontally. Mobile task dialog width was checked.
- The status labels and action controls include text; color is an additional cue. Explicit field labels and hint descriptions are retained.

Tests use PGlite and a local Chromium executable as described under the v0.1.0 environment limits below. Native PostgreSQL 17 and Docker were not rerun here. No GitHub release was published. There are no new migrations or dependency changes in v0.1.1.

---

# v0.1.0 verification

Verified on 19 October 2026, using Node.js 24.19.0 in the authoring environment.

## Results

| Check                      | Result | Evidence                                                                           |
| -------------------------- | ------ | ---------------------------------------------------------------------------------- |
| ESLint                     | Passed | No errors or warnings in delivered source                                          |
| TypeScript                 | Passed | Next route type generation and strict TypeScript check                             |
| Service/auth tests         | Passed | 22 tests across two suites                                                         |
| Service statement coverage | 97.58% | Vitest V8 report for the workspace service                                         |
| Production build           | Passed | All application routes compiled with Next.js 16.4.2                                |
| SQL migration              | Passed | Checked-in migration applied through the node-postgres migration runner            |
| Browser user story         | Passed | One comprehensive Playwright Chromium test, final run 7.0 seconds                  |
| Responsive layout          | Passed | Desktop and 390px mobile inspection; mobile document width did not exceed viewport |

## Browser story

Register an owner → create an organization → add and edit a client → create an active project → create a task → mark it done → verify persisted dashboard counts after reload → check mobile layout → invite a viewer → sign up from the invitation link → accept it → confirm the viewer can read data and has no create control → remove membership as owner → confirm the viewer can no longer open the workspace → delete the project → confirm its tasks are gone. No page JavaScript errors were observed in the owner flow.

A redundant router refresh immediately after invitation navigation was removed after this test exposed an authentication/navigation race. The corrected flow then passed twice against production builds. Native dialog fields also use explicit, unique labels after browser testing found ambiguous label matching.

The auth integration test independently exercises sign-up, wrong-password rejection, sign-in, session retrieval, sign-out and invalidation of an old session cookie. Service tests exercise cross-tenant reads/writes/deletes, SQL foreign-key enforcement, role changes, invitation expiry/revocation/reissue/single use and input validation.

## Environment and limits

Service/auth tests ran against isolated PGlite databases using the committed SQL. Browser tests ran against the real production-mode Next.js server and its normal node-postgres adapter, connected to a PGlite PostgreSQL wire-protocol server. A locally available Chromium 153 executable was used because the standard browser download could not be completed in this environment. No production code path bypassed authentication or authorization for testing.

Native PostgreSQL 17, Docker image builds and GitHub-hosted Actions were not executed here. CI is configured to run service/auth tests and the browser workflow against a PostgreSQL 17 service after the repository is published. A PGlite run does not establish native PostgreSQL concurrency behavior or operational readiness. Docker Compose/configuration is supplied for local use and still needs validation on a Docker-capable machine.

No GitHub repository or hosted release was created during this verification. The local repository and source archive contain the implementation, migration, tests and setup instructions.
