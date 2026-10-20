# Architecture

ArzDesk v0.4.0 is a modular Next.js application. Authentication belongs to Better Auth. Organization membership, invitations and business records belong to the workspace feature.

## Request path

1. A Server Component or Server Action calls `requireUser()`, which validates the session with Better Auth.
2. Server Actions validate input through Zod-backed service methods. Submitted role, user and organization fields never override authenticated context or the action’s explicit workspace scope.
3. The service reads membership from PostgreSQL and authorizes the permission. Roles are not trusted from browser state or cached cookies.
4. Every business read/update/delete includes `organization_id`. Tenant IDs are set by the service on inserts.
5. Drizzle sends parameterized SQL to PostgreSQL. Successful mutations revalidate the current workspace route.

No client component imports a database client. Type-only imports cross the service/UI boundary; Server Actions handle business mutations; Better Auth endpoints handle account changes.

## Tenant isolation and consistency

`organizations` owns `members`, `invitations`, `clients`, `projects` and `tasks`. Business IDs are UUID strings. Better Auth owns `user`, `session`, `account`, `verification` and `rate_limit`.

Projects have a composite `(organization_id, client_id)` foreign key to clients; tasks have a composite `(organization_id, project_id)` foreign key to projects. These constraints reject cross-tenant relationships even when writing direct SQL.

Mutations lock the organization row before checking membership. Role changes, invite acceptance/revocation and business writes follow the same lock order. A membership change cannot race an already-authorized write within that organization. Snapshot reads take a shared organization lock so cooperating writes cannot change their data mid-snapshot. Unrelated organizations remain independent. This intentionally favors clear correctness over high write throughput in the first release.

Database RLS is **not** enabled. Tenant isolation is enforced by the service layer and composite references. A database credential holder can still read all tenants; do not expose database credentials or grant browser access to PostgreSQL.

## Invitation design

- 32 cryptographically random bytes, encoded as a 64-character hexadecimal URL token.
- SHA-256 token hash at rest; the raw token is returned only when created.
- Seven-day expiration, email matching against the current authenticated user, revocation and single-use acceptance.
- Accept runs in a transaction, locks the organization and invitation, inserts membership once, and marks the invitation accepted.
- Reissuing revokes prior outstanding invitations for that email in the workspace.
- Existing members keep their current role; an old invitation cannot change it.
- Owner invitations are disallowed. Admins may invite/revoke only member and viewer invitations.
- Invitations are still shared manually; configured SMTP is used for account recovery and email-change confirmation. The private invitation token is a bearer secret and must be shared securely with the intended person. Email matching alone is not proof of mailbox ownership.

## Deletion behavior

A client with projects cannot be deleted. Delete the projects explicitly first. Deleting a project cascades to its tasks. Dialogs explain the scope before confirmation. Users, organizations and ownership do not have deletion/transfer flows in v0.1.0.

## Authentication and limits

Better Auth handles credential hashing, cookies, session lifecycle, origin checking and auth rate limiting. Passwords must contain 12–128 characters. Sessions last seven days and are updated after one day. Authentication rate counters live in PostgreSQL, not per-process memory. No role cookie cache is used.

`getAuth()` validates runtime configuration and initializes Better Auth on first request. Builds do not initialize authentication or access PostgreSQL. Next.js pages and Server Actions always validate sessions on the server; client UI visibility is supplementary.

For public deployment, set a secure canonical `BETTER_AUTH_URL`, terminate HTTPS, configure the trusted reverse proxy/IP boundary, and review signup abuse controls. Default auth rate limits are a baseline, not a complete anti-abuse system. App mutations use Next.js Server Action origin protection and bounded Zod fields.

## Current scale boundary

Snapshots load the workspace’s clients/projects/tasks for local filtering and dashboard counts. This is suitable for small early workspaces. Pagination, aggregate SQL queries, audit logging, server-side search and database RLS are roadmap work, not claims of this release.

## Account and navigation updates

`requireUser()` uses React request-local caching to deduplicate session reads within a render; no long-lived role/session authorization cache was added. The workspace layout loads authorized organizations and renders a persistent client shell. Each section still fetches an authorized, transactionally coherent snapshot. The header/sidebar remain visible while section skeletons load.

Profile delegates name, email and password operations to Better Auth. Email changes keep the old address until verification; an already verified old address must approve first. Password changes require the current password and revoke other sessions. SMTP and private development-terminal delivery share the existing settings. Appearance stores Light or Dark in local browser storage; no System preference remains in the current UI.
