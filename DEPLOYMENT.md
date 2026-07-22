# DigitalOcean Droplet redeployment guide

This guide assumes the site already runs on an Ubuntu Droplet behind Nginx and that `systemd` manages the Node.js process. Replace every value in `<ANGLE_BRACKETS>` before running a command. Do not blindly paste commands until you have identified the existing paths, service name, user, and port.

## Critical secret rule

Never commit or push `.env`. It contains production credentials. This repository ignores `.env` while keeping `.env.example` tracked.

Before pushing from your computer, verify:

```powershell
git check-ignore .env
git status --short
git ls-files .env
```

The first command should print `.env`; the last command should print nothing. If `.env` was ever committed, removing it in a later commit is not enough: rotate every exposed database/email password and purge the secret from Git history before pushing.

## 1. Record the current deployment

SSH into the Droplet using a sudo-enabled non-root user:

```bash
ssh <DEPLOY_USER>@<DROPLET_IP>
```

Inspect the currently running setup before changing it:

```bash
sudo systemctl list-units --type=service | grep -Ei 'turbo|glow|node|pm2'
sudo nginx -T
sudo ss -ltnp
node --version
npm --version
```

Record these values:

- Application directory, for example `/var/www/turbo-cleaner`
- Linux application user, for example `turboglow`
- systemd service name, for example `turbo-cleaner.service`
- Node port, normally `3001`
- Domain name and Nginx configuration path
- Current Git branch and commit: `git branch --show-current && git rev-parse HEAD`

The application requires a currently supported Node.js LTS release. Do not upgrade Node during the same deployment unless the installed release cannot run the app.

## 2. Back up before deployment

Create a DigitalOcean Droplet snapshot or backup first. Also preserve the old JSON submissions and current service configuration:

```bash
sudo cp /etc/systemd/system/<SERVICE_NAME>.service /etc/systemd/system/<SERVICE_NAME>.service.pre-token-auth
sudo cp <APP_DIR>/submissions.json /var/backups/turbo-cleaner-submissions-$(date +%F-%H%M%S).json
```

If MySQL already contains application data, take a database dump:

```bash
mysqldump --single-transaction -u <DB_ADMIN_USER> -p turbo_cleaner > /var/backups/turbo-cleaner-$(date +%F-%H%M%S).sql
```

The new application does **not** read `submissions.json`. Keep that backup until any old records have been migrated and verified.

## 3. Install or prepare MySQL

### Option A: MySQL on the same Droplet

If MySQL is not installed:

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

Create a dedicated database and least-privileged user. Use a new random password, not the admin dashboard password:

```bash
sudo mysql
```

```sql
CREATE DATABASE turbo_cleaner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'turbo_cleaner'@'localhost' IDENTIFIED BY '<LONG_RANDOM_DB_PASSWORD>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX ON turbo_cleaner.* TO 'turbo_cleaner'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Keep MySQL bound to localhost. Do not open port `3306` publicly.

### Option B: DigitalOcean Managed MySQL

Use the cluster's private hostname when the Droplet and database share a VPC. Add the Droplet as a trusted source and use the provider's application user/credentials. Download the cluster CA certificate to the Droplet, readable only by the application user; set `DB_SSL=true` and `DB_SSL_CA` to its absolute path. Do not expose the database to all inbound sources.

The app creates `submissions` and `admin_sessions` during startup, so its database user needs `CREATE` and `INDEX` for the first deployment. After both tables exist, those two privileges can be revoked if schema changes will be handled manually in future deployments.

## 4. Pull the release safely

In the existing application directory:

```bash
cd <APP_DIR>
git status --short
git branch --show-current
git rev-parse HEAD
```

Do not pull over uncommitted production edits. Back them up and reconcile them first. Then fetch and fast-forward the intended branch:

```bash
git fetch origin
git pull --ff-only origin <PRODUCTION_BRANCH>
npm ci --omit=dev
```

`npm ci` uses the committed lockfile and gives reproducible production dependencies.

## 5. Create the production environment file

Create `<APP_DIR>/.env` directly on the Droplet. Do not copy your local development `.env` into Git.

```bash
cd <APP_DIR>
cp .env.example .env
nano .env
```

Use values similar to:

```dotenv
PORT=3001
NODE_ENV=production

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=turbo_cleaner
DB_PASSWORD=<LONG_RANDOM_DB_PASSWORD>
DB_NAME=turbo_cleaner
DB_POOL_SIZE=10
DB_SSL=false
DB_SSL_CA=

ADMIN_PASSWORD_HASH=<GENERATED_SCRYPT_VALUE>

EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=465
EMAIL_USER=<SMTP_USER>
EMAIL_PASS=<SMTP_PASSWORD>
```

For Managed MySQL, replace the database host/port/user/password, use `DB_SSL=true`, and set `DB_SSL_CA=/absolute/path/to/the-downloaded-ca-certificate.crt`.

Generate a hash for a long, unique admin password. The plaintext password is not stored:

```bash
cd <APP_DIR>
npm run hash-password -- '<LONG_UNIQUE_ADMIN_PASSWORD>'
```

Copy the complete `scrypt$...` output into `ADMIN_PASSWORD_HASH`, then protect the file:

```bash
sudo chown <APP_USER>:<APP_USER> <APP_DIR>/.env
sudo chmod 600 <APP_DIR>/.env
```

## 6. Configure systemd

Use the existing unit if it is already correct. A suitable unit is:

```ini
[Unit]
Description=TurboGlow Cleaning website
After=network-online.target mysql.service
Wants=network-online.target

[Service]
Type=simple
User=<APP_USER>
Group=<APP_USER>
WorkingDirectory=<APP_DIR>
ExecStart=/usr/bin/node <APP_DIR>/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Find the exact Node binary path with `command -v node` and use it in `ExecStart`. If Node was installed through NVM, systemd will not automatically load NVM; use the absolute Node path or install Node system-wide.

Validate and restart:

```bash
sudo systemd-analyze verify /etc/systemd/system/<SERVICE_NAME>.service
sudo systemctl daemon-reload
sudo systemctl enable <SERVICE_NAME>
sudo systemctl restart <SERVICE_NAME>
sudo systemctl status <SERVICE_NAME> --no-pager
sudo journalctl -u <SERVICE_NAME> -n 100 --no-pager
```

Successful startup logs include `Server running at http://localhost:3001`. A missing environment variable or MySQL connection error causes startup to fail instead of running with insecure defaults.

## 7. Verify Nginx and HTTPS

The Node port should listen only behind Nginx/firewall rules. A minimal proxy location is:

```nginx
location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Do not add a separate Nginx static-file rule for this project. Node intentionally blocks access to `.env`, source files, `submissions.json`, and other private files.

Validate before reloading:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Production HTTPS is mandatory because the admin token cookie uses `Secure`. If the existing certificate is valid, retain it. Otherwise, point the domain's DNS A/AAAA records to the Droplet, then install/use Certbot for Nginx and verify renewal:

```bash
sudo certbot --nginx -d <DOMAIN> -d www.<DOMAIN>
sudo certbot renew --dry-run
```

Only ports `22` (preferably restricted to your IP), `80`, and `443` should be publicly reachable. Check both the DigitalOcean Cloud Firewall and UFW:

```bash
sudo ufw status verbose
```

Do not expose Node port `3001` or MySQL port `3306` publicly.

## 8. Post-deployment checks

Run these checks immediately:

1. Open `https://<DOMAIN>/` and submit one clearly labeled test quote.
2. Open `https://<DOMAIN>/login.html`; confirm a wrong password is rejected.
3. Log in with the new admin password and confirm the test quote appears.
4. Toggle its read/unread status and refresh the page.
5. Log out and confirm `/submissions.html` redirects to login.
6. Confirm these return `404` and disclose no data:

   ```bash
   curl -I https://<DOMAIN>/.env
   curl -I https://<DOMAIN>/submissions.json
   curl -I https://<DOMAIN>/server.js
   ```

7. Check service logs and MySQL rows:

   ```bash
   sudo journalctl -u <SERVICE_NAME> -n 100 --no-pager
   mysql -u turbo_cleaner -p -e "USE turbo_cleaner; SELECT id, received_at, status, name FROM submissions ORDER BY received_at DESC LIMIT 5;"
   ```

8. In browser developer tools, confirm the `admin_token` cookie has `HttpOnly`, `Secure`, and `SameSite=Strict`. Never paste the token into logs or support messages.

## 9. Rollback

Record the known-good commit before deployment. If the new release fails:

```bash
cd <APP_DIR>
git switch --detach <PREVIOUS_GOOD_COMMIT>
npm ci --omit=dev
sudo systemctl restart <SERVICE_NAME>
sudo journalctl -u <SERVICE_NAME> -n 100 --no-pager
```

This application only creates new tables during startup and does not destroy the old JSON file, so rolling the code back does not require dropping tables. Do not delete the MySQL tables during rollback. Once the previous version is stable, diagnose the failure and redeploy the production branch rather than leaving the server permanently detached.

## Routine deployment checklist

For later releases where infrastructure and `.env` already exist:

```bash
cd <APP_DIR>
git status --short
git rev-parse HEAD
mysqldump --single-transaction -u <DB_ADMIN_USER> -p turbo_cleaner > /var/backups/turbo-cleaner-$(date +%F-%H%M%S).sql
git fetch origin
git pull --ff-only origin <PRODUCTION_BRANCH>
npm ci --omit=dev
sudo systemctl restart <SERVICE_NAME>
sudo systemctl status <SERVICE_NAME> --no-pager
sudo journalctl -u <SERVICE_NAME> -n 100 --no-pager
sudo nginx -t
```

Then repeat the login, quote submission, logout, and private-file checks above.

## References

- [DigitalOcean: production-ready Droplet setup](https://docs.digitalocean.com/products/droplets/getting-started/recommended-droplet-setup/)
- [DigitalOcean: connect to a Droplet with OpenSSH](https://docs.digitalocean.com/products/droplets/how-to/connect-with-ssh/openssh/)
- [DigitalOcean: install an SSL certificate on a Droplet](https://docs.digitalocean.com/support/how-do-i-install-an-ssl-certificate-on-a-droplet/)
- [DigitalOcean: import MySQL databases](https://docs.digitalocean.com/products/databases/mysql/how-to/import-databases/)
