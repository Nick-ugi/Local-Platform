# Caddy with the admin web app inside: Caddy serves the admin's static files and passes everything
# else on (deploy/Caddyfile). Built from the repository root by deploy/compose.yaml.

FROM node:24-slim AS admin
WORKDIR /repo
COPY . .
RUN npm ci --workspace admin --workspace shared --include-workspace-root
# The Mapbox public token goes into the admin's browser code at build time.
ARG VITE_MAPBOX_TOKEN=""
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build --workspace admin

FROM caddy:2
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=admin /repo/admin/dist /srv/admin
