// reverse-cache.json: source_url → what Nominatim's reverse lookup found there (pickReverse in
// mapping.mjs), or null when it found nothing. Kept in the repository so a place is asked about once,
// and so fetch-places.mjs can fill in the same addresses without asking again.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const REVERSE_CACHE = join(dirname(fileURLToPath(import.meta.url)), "reverse-cache.json");

/** The cache, or an empty one before the first lookup. */
export function readReverseCache() {
  try {
    return JSON.parse(readFileSync(REVERSE_CACHE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

/** One line per place in source order, so a new lookup changes only its own lines. */
export function writeReverseCache(cache) {
  const lines = Object.keys(cache)
    .sort()
    .map((key) => `  ${JSON.stringify(key)}: ${JSON.stringify(cache[key])}`);
  writeFileSync(REVERSE_CACHE, `{\n${lines.join(",\n")}\n}\n`);
}
