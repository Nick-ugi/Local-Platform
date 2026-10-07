// Dates are shown in New Zealand time wherever the server or the visitor is.
const DATE_FORMAT = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Pacific/Auckland",
});

/** "2 Oct 2026" for an ISO 8601 instant. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** A URL as link text: no protocol, no trailing slash. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** The URL if it is safe to use as a link target (http or https), otherwise null. */
export function httpUrl(url: string): string | null {
  return /^https?:\/\//i.test(url) ? url : null;
}

/** A tel: link target for a phone number as it is displayed. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
