/** The longest search text the API accepts. */
export const MAX_QUERY_LENGTH = 100

/**
 * The search words of a ?q= value: trimmed, with single spaces between them, and cut to what the
 * API accepts. A missing or blank value is the empty string, which means "no search".
 */
export function normalizeQuery(value: string | string[] | undefined | null): string {
  const text = (Array.isArray(value) ? value[0] : value) ?? ''
  return text.trim().replace(/\s+/g, ' ').slice(0, MAX_QUERY_LENGTH).trim()
}
