import type { MetadataRoute } from "next";

/**
 * The web app's manifest (README "Mobile Web/PWA"): its name, colours and icons when a visitor adds
 * it to a phone's home screen. The icons are the app's (mobile/assets/brand); the blue is the lake.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Queenstown Local",
    short_name: "Queenstown",
    description: "What's near you in Queenstown: places, events and local notices on one map.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0369a1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // The pin sits well inside the middle 80% that a launcher's mask keeps.
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
