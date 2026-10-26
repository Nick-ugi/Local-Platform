// Fills in the street address of places in backend/seed/places.csv whose address only says
// "Queenstown", from Nominatim's reverse lookup (https://nominatim.org/release-docs/latest/api/Reverse/).
// Run from the repository root: node backend/seed/osm/reverse.mjs
//
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/) allows one
// request a second from an application that names itself, and asks that answers be kept rather than
// asked for again: every answer goes into reverse-cache.json, and a place in it is never asked again.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fillAddresses, fromCsv, pickReverse, toCsv } from "./mapping.mjs";
import { readReverseCache, writeReverseCache } from "./reverse-cache.mjs";

const CSV = join(dirname(fileURLToPath(import.meta.url)), "..", "places.csv");
const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "QueenstownLocal-seed/1.0 (+https://github.com/Nick-ugi/Local-Platform)";
// A little over a second between requests.
const PAUSE_MS = 1100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** What Nominatim finds at the place, as the cache keeps it. Waits and asks again when it is busy. */
async function lookUp(row) {
  const url = `${ENDPOINT}?format=jsonv2&lat=${row.latitude}&lon=${row.longitude}&zoom=18&addressdetails=1`;
  for (let attempt = 1; ; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
    if (response.ok) {
      return pickReverse(await response.json());
    }
    if (attempt === 3 || (response.status !== 429 && response.status < 500)) {
      throw new Error(`Nominatim answered ${response.status} for ${row.sourceUrl}`);
    }
    const wait = attempt * 10_000;
    console.error(`Nominatim answered ${response.status}; trying again in ${wait / 1000} s`);
    await sleep(wait);
  }
}

const rows = fromCsv(readFileSync(CSV, "utf8"));
const cache = readReverseCache();
const queenstownOnly = (list) => list.filter((row) => row.address === "Queenstown").length;
const missing = rows.filter((row) => row.address === "Queenstown" && !(row.sourceUrl in cache));

console.log(`${queenstownOnly(rows)} places say only "Queenstown"; ${missing.length} not looked up yet`);
for (const [i, row] of missing.entries()) {
  if (i > 0) await sleep(PAUSE_MS);
  cache[row.sourceUrl] = await lookUp(row);
  // Saved as it goes, so a stopped run loses little.
  if ((i + 1) % 20 === 0 || i === missing.length - 1) {
    writeReverseCache(cache);
    console.log(`${i + 1}/${missing.length}`);
  }
}

const filled = fillAddresses(rows, cache);
writeFileSync(CSV, toCsv(filled));
console.log(`Address "Queenstown" only: ${queenstownOnly(filled)} of ${filled.length} places`);
