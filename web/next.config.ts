import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./src/lib/securityHeaders";

const nextConfig: NextConfig = {
  // @queenstown/shared ships TypeScript source, so Next.js compiles it.
  transpilePackages: ["@queenstown/shared"],
  // A self-contained server for the container image (web/Dockerfile). The tracing starts at the
  // repository root so the workspace packages it uses are copied too.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
