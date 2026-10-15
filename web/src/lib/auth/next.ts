/**
 * Where to go after logging in: the ?next= value when it is a path on this site, and the home page
 * otherwise. "//evil.example" and "/\evil.example" are addresses of other sites to a browser, so
 * they are refused.
 */
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}

/** The login screen that comes back to `path` afterwards. */
export function loginPath(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}
