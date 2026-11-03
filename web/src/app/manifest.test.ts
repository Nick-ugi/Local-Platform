import { expect, test } from "vitest";
import { DEFAULT_SHARE_IMAGE } from "@/lib/seo/shareImage";
import { siteMetadata } from "@/lib/seo/siteMetadata";
import manifest from "./manifest";

test("the web app can be added to a phone's home screen with its name, colour and icons", () => {
  expect(manifest()).toEqual({
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
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  });
});

test("every page shares the site's picture unless it has its own", () => {
  const metadata = siteMetadata("Queenstown Local", new URL("https://queenstownlocal.example"));

  expect(metadata.metadataBase?.toString()).toBe("https://queenstownlocal.example/");
  expect(metadata.title).toEqual({ default: "Queenstown Local", template: "%s | Queenstown Local" });
  expect(metadata.openGraph).toMatchObject({ siteName: "Queenstown Local", images: [DEFAULT_SHARE_IMAGE] });
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  expect(DEFAULT_SHARE_IMAGE).toEqual({ url: "/og-default.png", width: 1200, height: 630, alt: "Queenstown Local" });
});
