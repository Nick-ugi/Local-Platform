import { requestJson } from "@queenstown/shared";

/**
 * The PC's backend as the Android emulator sees it. Inside the emulator "localhost" is the
 * emulator itself; 10.0.2.2 is the machine it runs on.
 */
const EMULATOR_BACKEND = "http://10.0.2.2:8080";

/**
 * Where the backend is: EXPO_PUBLIC_API_BASE_URL, set in mobile/.env.local or the build's
 * environment. Expo writes the value into the bundle when it is built, so a change needs the
 * development server restarted.
 */
export function apiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL || EMULATOR_BACKEND;
}

/**
 * GET /api/v1{path} on the backend. The app is not a browser, so it calls the backend directly
 * and no CORS is involved. Rejects with an ApiError for every failure; a cancelled request rejects
 * with the abort error itself.
 */
export function apiGet<T>(path: string, options: { signal?: AbortSignal } = {}): Promise<T> {
  return requestJson<T>(`${apiBaseUrl()}/api/v1${path}`, { signal: options.signal });
}
