# Security policy

v0.1.x is early software. The current release has service-level tenant isolation, role checks, private hashed invitation tokens and database constraints, but has not received an independent security audit.

## Reporting

Do not put credentials, private tenant data or a working exploit containing user data into a public issue. If the GitHub repository has private vulnerability reporting enabled, use **Security → Report a vulnerability**. Otherwise ask the maintainer for a private reporting channel without disclosing the vulnerability publicly.

## Self-hosting

Use HTTPS and a strong unique `BETTER_AUTH_SECRET`; configure `BETTER_AUTH_URL` explicitly. Keep PostgreSQL private and backed up. Review the trusted reverse proxy/IP headers used for authentication rate limiting. Public registration has no mailbox verification or password recovery in v0.1.0. Share invitation links only with their intended recipients. Treat database administrators as trusted across organizations; RLS is not enabled.

Use dedicated disposable databases for all tests. Optional `TEST_DATABASE_URL` tests truncate tables. Browser tests create accounts and records.
