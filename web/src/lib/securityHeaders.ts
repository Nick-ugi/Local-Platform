/**
 * Headers every page and route of the web app sends (next.config.ts). HSTS is not here: it belongs
 * to whatever ends HTTPS in front of the app (Caddy on a server, Render's balancer).
 * Geolocation stays allowed for this site itself: the map asks for it on the location button.
 */
export const securityHeaders: readonly { key: string; value: string }[] = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];
