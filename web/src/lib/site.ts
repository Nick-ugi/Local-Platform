// Where the web app runs locally (package.json "dev").
const LOCAL_SITE = "http://localhost:3001";

/**
 * The public address of the site, from SITE_URL. Canonical links and og:url are written as paths
 * and resolved against it, so they point at the real site wherever the page is rendered. Without a
 * usable value it is the local web app.
 */
export function siteUrl(): URL {
  const value = process.env.SITE_URL;
  if (value) {
    try {
      return new URL(value);
    } catch {
      // Not a URL: fall through to the local address.
    }
  }
  return new URL(LOCAL_SITE);
}
