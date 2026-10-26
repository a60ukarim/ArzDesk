# ArzDesk — public launch checklist

ArzDesk is an MIT-licensed, public GitHub project: https://github.com/a60ukarim/ArzDesk.

**Current scope:** v0.6.1 is an installable web app (PWA). Device workspaces work offline once the `/offline` shell reports **Ready for offline use**. The app is not a downloadable Windows EXE or Android APK. Device data lives in IndexedDB; it does **not** automatically sync to other devices or cloud workspaces.

## Public links

- Product overview and honest feature disclosure: `/about`
- Start locally on this device: `/offline`
- Installation guide: `/install`
- Online team mode: `/cloud` (requires a connection and configured production services)
- Source and issue tracker: https://github.com/a60ukarim/ArzDesk

## Required before publicly advertising online accounts

- [ ] Configure a verified email sender and production SMTP variables (`MAIL_MODE=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`) in Vercel. Do not put their values in GitHub or chat.
- [ ] Send and complete a real password recovery email; verify changing the account email and new-user invitation workflows on two different devices.
- [ ] Confirm production database migrations, backup strategy and restoration on a disposable database before inviting users.
- [ ] Verify rate limits, logs, public signup abuse controls and deployment access policy.
- [ ] Verify mobile and desktop installation, offline refresh and JSON export/import on real devices.
- [ ] Publish a user-facing privacy statement suitable for your operating jurisdiction and actual infrastructure/retention practices. The MIT license is not a privacy policy.
- [ ] Review app dependencies/security notifications and any current GitHub Actions advisories.
- [ ] Complete a manual release sign-off from the founder.

Until these are complete, describe **device work** as the launch-ready feature and **shared online accounts** as a separate feature under verification. Never suggest device data is backed up to the cloud.

## Release discipline

1. Open a PR and allow CI (format, lint, types, tests, build, and Playwright) to pass.
2. Verify preview deployment, public `/about` page and `/offline` readiness on real devices.
3. Merge only after review; Vercel's Git integration deploys the new `main` commit.
4. Verify the production URL and monitor errors. Then prepare a tagged release and public announcement.
5. Preserve environment secrets and user data; never commit `.env`, exports, `.next`, or `node_modules`.

The project can be announced as a **public beta for local/offline work** once the device checks pass. Advertise online collaboration as fully supported only when its email and production data recovery flows have been verified.
