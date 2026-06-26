# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY tsconfig.base.json ./

RUN npm ci

COPY apps/api apps/api
COPY apps/web apps/web

RUN npm run build

FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  nginx \
  sqlite3 \
  python3 \
  python3-pip \
  tini \
  curl \
  bash \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default

COPY temp/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt \
  && rm /tmp/requirements.txt

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./apps/web/dist

COPY scripts/create_db.sh ./scripts/create_db.sh
COPY scripts/create_users.sh ./scripts/create_users.sh
COPY temp/server.py temp/gpt2.py ./schedule_service/
COPY temp/fixtures.json temp/fixtures.html ./schedule_service/

COPY setup/nginx.conf /etc/nginx/nginx.conf
COPY setup/ttt-site.conf /etc/nginx/conf.d/default.conf
COPY setup/entrypoint.sh /app/setup/entrypoint.sh

RUN chmod +x /app/setup/entrypoint.sh /app/scripts/create_db.sh \
  && chmod -R a+rX /app/apps/web/dist \
  && mkdir -p /data /var/log/nginx /run

ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=3000 \
  DB_PATH=/data/ttt.db \
  SCHEDULE_SERVICE_URL=http://127.0.0.1:8383 \
  SESSION_COOKIE_SECURE=0 \
  TRUST_PROXY=1 \
  SESSION_SECRET=change-me-in-production

EXPOSE 80

VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost/api/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/app/setup/entrypoint.sh"]
