# TTT — Table Tennis Tournament Manager

Web app to run table-tennis tournaments: register players, create stages, generate fixtures, schedule matches, record scores, view leaderboards, and move players between stages.

Monorepo layout:

| Package | Role |
|---------|------|
| `apps/api` | Express API, SQLite, session auth |
| `apps/web` | React SPA (Vite) |

For deployment you can use the **Docker image** (all-in-one, recommended for homelab) or a **manual** nginx + Node setup (see [Production deployment](#production-deployment)).

The Docker image bundles:

| Component | Role |
|-----------|------|
| **nginx** | Serves `apps/web/dist`, proxies `/api` to Node |
| **Node API** | Express + SQLite (`/data/ttt.db`) |
| **Python schedule service** | Flask app in `/app/schedule_service` (port 8383, internal) |

Process supervision uses **tini** + `setup/entrypoint.sh` (nginx, Python, and Node).

---

## Prerequisites

**Development / manual deploy:**

- **Node.js 20+** and **npm**
- **sqlite3** CLI (for `db:init`)
- **jq** and **curl** (API integration tests only)
- **nginx** (manual production deploy)
- **Schedule service** on the host or LAN (manual deploy only; included in Docker image)

**Docker deploy:**

- **Docker** 20+

---

## Development

### Install and configure

```bash
npm install
cp .env.example .env
npm run db:init
```

`db:init` creates `data/ttt.db` from `scripts/create_db.sh` (schema only). Create login users manually (see [Create users](#create-users) under Production deployment, or [Create users (Docker)](#create-users-docker)). API integration tests expect seeded users (`admin1`, `guest1`, `super1` with password `secret`).

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

For **manual** deployment only (skip if you use [Docker](#docker)):

```bash
git clone <repo-url> /opt/ttt
cd /opt/ttt
npm ci
cp .env.example .env   # then edit for production — see below
npm run build
```

Use `npm ci` in production for reproducible installs. `npm run build` runs both workspaces (`build:api` then `build:web`).

---

## Docker

Recommended for homelab / LAN: one image runs nginx, the API, the Python schedule service, and initializes SQLite on first boot. You only need Docker on the host — no separate Node, Python, or nginx install. Configuration is via `docker run -e` (or `--env-file`); there is no `.env` file inside the image.

```text
Browser → nginx :80
            ├── /api/*  → Node API (127.0.0.1:3000)
            └── /*      → apps/web/dist (SPA)
Node API → Python schedule service (127.0.0.1:8383, internal)
SQLite   → /data/ttt.db (Docker volume)
```

Process supervision: **tini** → `setup/entrypoint.sh` (starts nginx, Python, and Node; shuts all down on exit).

### Quick start

```bash
# 1. Build
docker build -t ttt:latest .

# 2. Run (set SESSION_SECRET — required)
docker run -d --name ttt --restart unless-stopped -p 80:80 \
  -v ttt-data:/data \
  -e SESSION_SECRET="$(openssl rand -base64 32)" \
  ttt:latest

# 3. Create a login user (DB starts empty)
docker exec ttt node -e "const b=require('bcrypt'); console.log(b.hashSync('your-password',10))"
docker exec ttt sqlite3 /data/ttt.db \
  "INSERT INTO users (username, password, role) VALUES ('admin1', '<paste-hash>', 'admin');"

# 4. Open http://localhost and log in
curl -s http://localhost/api/health
```

Use `-p 8080:80` if host port 80 is unavailable. See below for env vars, troubleshooting, and upgrades.

### Build the image

From the repository root:

```bash
docker build -t ttt:latest .
```

The Dockerfile (multi-stage, `node:24-bookworm-slim`):

1. **Build stage** — `npm ci` + `npm run build` → `apps/api/dist` and `apps/web/dist`
2. **Runtime stage** — nginx, sqlite3, Python 3, tini, curl
3. Python deps from `temp/requirements.txt` (Flask, OR-Tools, etc.)
4. Schedule service copied to `/app/schedule_service` (`server.py`, `gpt2.py`, fixtures)
5. nginx config from `setup/nginx.conf` and `setup/ttt-site.conf`
6. `setup/entrypoint.sh` (tini CMD) and `scripts/create_db.sh` (+ optional `scripts/create_users.sh`)
7. Built-in `HEALTHCHECK` on `GET /api/health`

### Run the container

Generate a session secret once:

```bash
openssl rand -base64 32
```

Start the container:

```bash
docker run -d \
  --name ttt \
  --restart unless-stopped \
  -p 80:80 \
  -v ttt-data:/data \
  -e SESSION_SECRET='paste-output-of-openssl-rand-base64-32' \
  ttt:latest
```

Use `-p 8080:80` instead if you cannot bind host port 80. Open **http://localhost** (or `http://<host-ip>` on your LAN).

| Flag / path | Purpose |
|-------------|---------|
| `-p 80:80` | HTTP UI + API (nginx listens on container port 80) |
| `-v ttt-data:/data` | Persistent SQLite at `/data/ttt.db` (named volume; survives container recreate) |
| `-v /host/path/ttt:/data` | Same, but bind-mount a host directory instead of a named volume |
| `-e SESSION_SECRET=...` | **Required** — do not rely on the image default |
| `--restart unless-stopped` | Start again after host reboot |

On first start, `setup/entrypoint.sh` runs `scripts/create_db.sh` when `/data/ttt.db` is missing. There is **no `.env` file** in the image; pass config with `-e` or `--env-file`.

### Environment variables (Docker)

Defaults are set in the `Dockerfile` / `setup/entrypoint.sh`. Override at runtime as needed:

| Variable | Default in image | Purpose |
|----------|------------------|---------|
| `SESSION_SECRET` | `change-me-in-production` | Session cookie signing — **always override** |
| `HOST` | `0.0.0.0` | API bind address (internal) |
| `DB_PATH` | `/data/ttt.db` | SQLite file path |
| `SESSION_COOKIE_SECURE` | `0` | `0` = cookies work over **HTTP** (port 80). Set `1` if you terminate **HTTPS** in front of the container |
| `TRUST_PROXY` | `1` | Trust `X-Forwarded-*` from nginx (correct for this image) |
| `NODE_ENV` | `production` | Production API behaviour |
| `SCHEDULE_SERVICE_URL` | `http://127.0.0.1:8383` | Internal Python scheduler (already in the same container) |
| `PORT` | `3000` | API listen port (internal; nginx proxies to this) |

Example with an env file (keep out of git):

```bash
# ttt.env
SESSION_SECRET=your-long-random-secret
SESSION_COOKIE_SECURE=0
```

```bash
docker run -d --name ttt -p 80:80 -v ttt-data:/data --env-file ttt.env ttt:latest
```

**HTTP and login (401 errors):**

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| 401 on `/api/auth/me` and most routes **before** login | Normal — not logged in yet | Log in at `/login` |
| 401 on `/api/auth/login` | No user in DB or wrong password | [Create users](#create-users-docker) |
| 401 on **everything after** login | Session cookie not sent | Keep `SESSION_COOKIE_SECURE=0` for plain HTTP (image default). Browsers refuse `Secure` cookies on `http://` |

`TRUST_PROXY=1` is already set for nginx inside the container. It does **not** fix HTTP cookie issues — use `SESSION_COOKIE_SECURE=0` without HTTPS, or terminate TLS and set `SESSION_COOKIE_SECURE=1`.

### Create users (Docker) {#create-users-docker}

The auto-created database has **no login users**. Create one after the container is running:

```bash
# bcrypt hash for your password
docker exec ttt node -e "const b=require('bcrypt'); console.log(b.hashSync('your-password',10))"

# insert an admin user
docker exec ttt sqlite3 /data/ttt.db \
  "INSERT INTO users (username, password, role) VALUES ('admin1', '<paste-hash-here>', 'admin');"
```

Roles: `superadmin`, `admin`, `scorer`, `guest`.

**Homelab shortcut** — seed four users (`superadmin`, `admin`, `scorer`, `guest`) with password `asecretz`:

```bash
docker exec ttt bash /app/scripts/create_users.sh
```

Use only on a fresh DB; re-running will fail if usernames already exist.

### Verify

```bash
curl -s http://localhost/api/health
# {"ok":true,"db":"connected"}

docker inspect --format='{{.State.Health.Status}}' ttt
# healthy (after ~20s start period)

docker logs ttt
```

In the browser: log in at `/login`, then confirm `GET /api/auth/me` returns 200 (DevTools → Network).

### Backup

Copy the database from the volume while the container is running (SQLite WAL allows hot copy):

```bash
docker cp ttt:/data/ttt.db ./ttt-backup-$(date +%Y%m%d).db
# also copy ttt.db-wal and ttt.db-shm if present
```

Restore by stopping the container, replacing files under the mounted `/data` path, and starting again.

### Upgrade

```bash
docker build -t ttt:latest .
docker stop ttt && docker rm ttt
# named volume ttt-data keeps your database
docker run -d --name ttt --restart unless-stopped -p 80:80 \
  -v ttt-data:/data \
  -e SESSION_SECRET='your-secret' \
  ttt:latest
```

Or reuse `--env-file ttt.env` if you created one at first deploy.

### Layout (reference)

| Path in container | Contents |
|-------------------|----------|
| `/app/apps/api/dist` | Compiled API |
| `/app/apps/web/dist` | Built SPA (nginx `root`) |
| `/app/schedule_service` | `server.py`, `gpt2.py` |
| `/app/scripts/create_db.sh` | DB schema initializer |
| `/app/scripts/create_users.sh` | Optional homelab user seed script |
| `/app/setup/entrypoint.sh` | Starts nginx, Python, Node |
| `/data/ttt.db` | SQLite (volume) |

---

## Production deployment

Bare-metal or VM install (without Docker): build on the host, run Node and the schedule service separately, and use host nginx for TLS and static files. For an all-in-one container, see [Docker](#docker).

### 1. Environment

Edit `.env` at the **repository root** (the API loads it from there, not from `apps/api`):

```env
HOST=0.0.0.0
PORT=3000
DB_PATH=/var/lib/ttt/ttt.db
SESSION_SECRET=<long-random-string>
NODE_ENV=production
SESSION_COOKIE_SECURE=1
TRUST_PROXY=1
SCHEDULE_SERVICE_URL=http://127.0.0.1:8383
```

| Variable | Notes |
|----------|--------|
| `DB_PATH` | Use an **absolute** path in production; ensure the Node user can read/write the file and directory |
| `SESSION_SECRET` | Rotate on deploy; required for session cookies |
| `SESSION_COOKIE_SECURE` | `1` for HTTPS; set `0` for plain HTTP (e.g. local testing only) |
| `TRUST_PROXY=1` | Required when behind nginx so Express trusts `X-Forwarded-Proto` |
| `SCHEDULE_SERVICE_URL` | Schedule service must not be exposed publicly; bind to localhost or restrict by firewall |

### 2. Database

```bash
mkdir -p /var/lib/ttt
DB_PATH=/var/lib/ttt/ttt.db npm run db:init
# or: bash scripts/create_db.sh /var/lib/ttt/ttt.db
```

To recreate from scratch (destructive): `RESET_DB=1 bash scripts/create_db.sh /var/lib/ttt/ttt.db`

**Backups:** copy `ttt.db` and, if present, `ttt.db-wal` / `ttt.db-shm`. SQLite WAL allows hot copies while the app is running.

### 3. Create users {#create-users}

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