# TTT — Table Tennis Tournament Manager

Web app to run table-tennis tournaments: register players, create stages, generate fixtures, schedule matches, record scores, view leaderboards, and move players between stages.

Monorepo layout:

| Package | Role |
|---------|------|
| `apps/api` | Express API, SQLite, session auth |
| `apps/web` | React SPA (Vite) |

In production, **nginx** serves the built SPA and reverse-proxies `/api` to the Node process. An external **schedule service** (default `http://127.0.0.1:8383`) must be reachable for league scheduling.

---

## Prerequisites

- **Node.js 20+** and **npm**
- **sqlite3** CLI (for `db:init`)
- **jq** and **curl** (API integration tests only)
- **nginx** (production TLS and reverse proxy)
- **Schedule service** on the host or LAN (see `SCHEDULE_SERVICE_URL`)

---

## Development

### Install and configure

```bash
npm install
cp .env.example .env
npm run db:init
```

`db:init` creates `data/ttt.db` from `scripts/create_db.sh` (schema only). Create login users manually (see [Create users](#create-users) below). API integration tests expect seeded users (`admin1`, `guest1`, `super1` with password `secret`).

### Run locally

From the repository root (`.env` and `DB_PATH=./data/ttt.db` resolve from here):

```bash
# Terminal 1 — API (default http://localhost:3000)
npm run dev:api

# Terminal 2 — web dev server with /api proxy (http://localhost:5173)
npm run dev:web
```

Open **http://localhost:5173** for the UI.

### Build (development check)

```bash
npm run build
```

Produces:

- `apps/api/dist/` — compiled API
- `apps/web/dist/` — production SPA assets

---

## Production build

On your build machine or the server:

```bash
git clone <repo-url> /opt/ttt
cd /opt/ttt
npm ci
cp .env.example .env   # then edit for production — see below
npm run build
```

Use `npm ci` in production for reproducible installs. `npm run build` runs both workspaces (`build:api` then `build:web`).

---

## Production deployment

### 1. Environment

Edit `.env` at the **repository root** (the API loads it from there, not from `apps/api`):

```env
HOST=0.0.0.0
PORT=3000
DB_PATH=/var/lib/ttt/ttt.db
SESSION_SECRET=<long-random-string>
NODE_ENV=production
TRUST_PROXY=1
SCHEDULE_SERVICE_URL=http://127.0.0.1:8383
```

| Variable | Notes |
|----------|--------|
| `DB_PATH` | Use an **absolute** path in production; ensure the Node user can read/write the file and directory |
| `SESSION_SECRET` | Rotate on deploy; required for session cookies |
| `NODE_ENV=production` | Enables `secure` session cookies (HTTPS only) |
| `TRUST_PROXY=1` | Required when behind nginx so sessions work with `X-Forwarded-Proto` |
| `SCHEDULE_SERVICE_URL` | Schedule service must not be exposed publicly; bind to localhost or restrict by firewall |

### 2. Database

```bash
mkdir -p /var/lib/ttt
DB_PATH=/var/lib/ttt/ttt.db npm run db:init
# or: bash scripts/create_db.sh /var/lib/ttt/ttt.db
```

To recreate from scratch (destructive): `RESET_DB=1 bash scripts/create_db.sh /var/lib/ttt/ttt.db`

**Backups:** copy `ttt.db` and, if present, `ttt.db-wal` / `ttt.db-shm`. SQLite WAL allows hot copies while the app is running.

### 3. Create users

Users are stored in the `users` table with **bcrypt**-hashed passwords (no admin UI in v1).

Generate a hash from the repo (bcrypt is installed with the API):

```bash
node -e "const bcrypt=require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"
```

Insert users (example):

```bash
sqlite3 /var/lib/ttt/ttt.db \
  "INSERT INTO users (username, password, role) VALUES ('admin1', '<bcrypt-hash>', 'admin');"
```

Roles: `superadmin`, `admin`, `scorer`, `guest`.

### 4. Schedule service

League **Schedule** calls the external HTTP service at `SCHEDULE_SERVICE_URL`. Start it before using scheduling (default port **8383** on the same host is typical). Without it, schedule creation returns an error; other modules still work.

### 5. Run the API

After `npm run build`:

```bash
cd /opt/ttt
npm run start:api
```

Or directly:

```bash
node apps/api/dist/index.js
```

Use **systemd**, **pm2**, or similar to keep the process running. Example systemd unit:

```ini
[Unit]
Description=TTT API
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ttt
EnvironmentFile=/opt/ttt/.env
ExecStart=/usr/bin/node apps/api/dist/index.js
Restart=on-failure
User=ttt

[Install]
WantedBy=multi-user.target
```

Health check: `GET /api/health` on the API port.

### 6. nginx (recommended)

Serve the Vite build as static files and proxy API requests to Node. This matches the current codebase (the API serves `/api/*` only; the SPA is static).

```nginx
server {
    listen 443 ssl http2;
    server_name tt.example.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    root /opt/ttt/apps/web/dist;
    index index.html;

    # API → Node
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA — client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload nginx after changes. Users access **https://tt.example.com** (not the raw Node port).

### 7. Deploy / upgrade checklist

1. Pull or copy new release to `/opt/ttt`
2. `npm ci && npm run build`
3. Back up `ttt.db` if upgrading in place
4. Restart the API service (`systemctl restart ttt` or equivalent)
5. Confirm `GET https://tt.example.com/api/health` returns OK
6. Smoke-test login and one tournament flow

---

## Tests

**Unit tests** (no server):

```bash
npm test
```

**API integration tests** (API must be running; seeded users required):

```bash
npm run dev:api   # separate terminal
npm run test:api
```

Single suite example:

```bash
./scripts/test_stages_api.sh http://localhost:3000
```

**Web tests only:**

```bash
npm run test:web
```

---

## Documentation

- [docs/prd.md](docs/prd.md) — product requirements
- [docs/API.md](docs/API.md) — HTTP API
- [docs/UI.md](docs/UI.md) — screens and routes
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design and deployment overview