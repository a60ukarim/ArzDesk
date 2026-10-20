# Private trial repository

The GitHub destination is `a60ukarim/ArzDesk`. Keep its visibility **Private** for the founder review. Any future public/open-source release is a separate decision. The MIT license in the source does not change repository visibility.

Keep `.env`, credentials, database exports, `.next` and `node_modules` out of Git. `.env.example` contains placeholders only. Source changes do not publish a running app.

For a fresh checkout:

```sh
git clone https://github.com/a60ukarim/ArzDesk.git
cd ArzDesk
npm ci
```

Follow README for a local database and environment configuration. If you already have local source and data, preserve `.env` and PostgreSQL. Do not replace your existing local Git history with an unrelated initialized repository; fetch and review the remote first.

The first remote import can contain a snapshot of the prepared v0.5.0 source rather than earlier local development commits. A source ZIP from GitHub is not an installer.

Run CI after upload and inspect its actual result before claiming it passed remotely. Tag and GitHub release creation are separate from a branch push. The online trial requires HTTPS hosting, PostgreSQL and SMTP as described in [installation and hosting](install-and-host.ar.md).
