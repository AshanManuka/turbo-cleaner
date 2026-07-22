# TurboGlow Cleaner

The site uses MySQL for quote submissions and revocable, random-token admin sessions. Admin tokens are stored only in an `HttpOnly`, `SameSite=Strict` cookie; only SHA-256 token hashes are stored in MySQL.

## Setup

1. Create a MySQL database and least-privileged application user:

   ```sql
   CREATE DATABASE turbo_cleaner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'turbo_cleaner'@'localhost' IDENTIFIED BY 'use-a-long-random-password';
   GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX ON turbo_cleaner.* TO 'turbo_cleaner'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Copy `.env.example` to `.env` and fill in the database settings.
3. Generate the admin password hash. Put the output in `ADMIN_PASSWORD_HASH` in `.env`:

   ```powershell
   npm run hash-password -- "a-long-unique-admin-password"
   ```

4. Install and start:

   ```powershell
   npm install
   npm start
   ```

The server creates the `submissions` and `admin_sessions` tables on startup. In production, set `NODE_ENV=production` and serve the app through HTTPS. For a remote MySQL provider, set `DB_SSL=true` and point `DB_SSL_CA` to its trusted CA certificate file.

The old `submissions.json` file is no longer read or publicly served. Existing records must be migrated separately if they are needed.
