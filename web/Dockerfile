# The web app as a container image. Build from the repository root, because the app uses the shared
# workspace: docker build -f web/Dockerfile --build-arg NEXT_PUBLIC_MAPBOX_TOKEN=pk... -t queenstown-web .
# Render (render.yaml) passes the service's environment variables as these build arguments.

FROM node:24-slim AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm ci --workspace web --workspace shared --include-workspace-root
# The Mapbox public token is written into the browser code at build time. It is not a secret, but it
# is restricted to the site's addresses in the Mapbox account.
ARG NEXT_PUBLIC_MAPBOX_TOKEN=""
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
RUN npm run build --workspace web

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1 \
	PORT=3000 \
	HOSTNAME=0.0.0.0
# output: "standalone" (next.config.ts) leaves a server with only the files it needs.
COPY --from=build --chown=node:node /repo/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/web/.next/static ./web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
	CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/robots.txt').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "web/server.js"]
