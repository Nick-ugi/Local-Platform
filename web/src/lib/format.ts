import type { LatLng } from "@queenstown/shared";

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

/**
 * A tel: link target for a phone number as it is displayed, or null when the text is not one that
 * can be dialled: only digits, spaces and + - ( ), with at least three digits.
 */
export function telHref(phone: string): string | null {
  if (!/^[\d\s+()-]+$/.test(phone) || (phone.match(/\d/g) ?? []).length < 3) {
    return null;
  }
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/** Google Maps directions to a point. On a phone it opens the maps app. */
export function directionsUrl(place: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
}
