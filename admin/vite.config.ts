import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The admin calls the API at its own origin under /api. In development Vite passes those requests
// to the backend, so the backend needs no CORS (README, "Admin").
const BACKEND = process.env.API_BASE_URL || "http://localhost:8080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: BACKEND, changeOrigin: true } },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
