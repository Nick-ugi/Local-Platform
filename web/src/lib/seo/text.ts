// Search engines show about this much of a description.
const MAX_DESCRIPTION = 160;

/** The text on one line with single spaces, cut at a word with "…" when it is too long. */
export function shorten(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= MAX_DESCRIPTION) {
    return line;
  }
  // Cut at the last space that leaves room for the ellipsis, so the last word is whole. A word
  // that ends right at the limit is followed by a space at the limit and is kept.
  const lastSpace = line.lastIndexOf(" ", MAX_DESCRIPTION - 1);
  const kept = lastSpace > 0 ? line.slice(0, lastSpace) : line.slice(0, MAX_DESCRIPTION - 1);
  return `${kept.trimEnd()}…`;
}
