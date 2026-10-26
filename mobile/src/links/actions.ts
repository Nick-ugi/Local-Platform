import { directionsUrl, httpUrl, type LatLng, telHref } from "@queenstown/shared";
import { Linking, Platform, Share } from "react-native";

// Where the web app runs locally (web/package.json "dev"). Shared links point at the web app, so
// whoever receives one can open it without the app (docs/03-user-flow.md, "Web과 App의 차이").
const LOCAL_SITE = "http://localhost:3001";

/** The web app's address for a path, from EXPO_PUBLIC_SITE_URL. */
export function webUrl(path: string): string {
  const site = (process.env.EXPO_PUBLIC_SITE_URL || LOCAL_SITE).replace(/\/+$/, "");
  return `${site}${path}`;
}

// Something that looks like one email address: no spaces, one @, a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The operator's address from EXPO_PUBLIC_CONTACT_EMAIL, for "Suggest an edit" (MORE-02). Without
 * a usable value there is none, and the app does not offer it. The web app's rule
 * (web/src/lib/contact.ts).
 */
export function contactEmail(): string | null {
  const value = process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim();
  return value && EMAIL.test(value) ? value : null;
}

/** Starts an email to the operator in the phone's mail app. False without an address or a mail app. */
export function emailOperator(subject: string, body: string): Promise<boolean> {
  const email = contactEmail();
  return email
    ? open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    : Promise.resolve(false);
}

/** Opens a URL in the app that handles it. False when the phone has none or refused. */
async function open(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Dials a number as a place displays it. False for a number that cannot be dialled. */
export function call(phone: string): Promise<boolean> {
  const tel = telHref(phone);
  return tel ? open(tel) : Promise.resolve(false);
}

/** Opens an http(s) address in the browser; anything else is refused. */
export function openWebsite(url: string): Promise<boolean> {
  const safe = httpUrl(url);
  return safe ? open(safe) : Promise.resolve(false);
}

/**
 * Directions in the phone's maps app (PLACE-05): a geo: address on Android, Apple Maps on iOS,
 * and Google Maps on the web when neither opens.
 */
export async function openDirections(place: LatLng, name: string): Promise<boolean> {
  const { latitude, longitude } = place;
  const native =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?daddr=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`;
  return (await open(native)) || open(directionsUrl(place));
}

/**
 * The phone's share sheet with the web address of a detail screen (COMMON-05). Closing the sheet
 * is not a failure. Never rejects.
 */
export async function shareLink(title: string, path: string): Promise<boolean> {
  const url = webUrl(path);
  try {
    // Android shares the message, iOS the url; each gets the address once.
    await Share.share(Platform.OS === "ios" ? { title, url } : { title, message: `${title}\n${url}` });
    return true;
  } catch {
    return false;
  }
}
