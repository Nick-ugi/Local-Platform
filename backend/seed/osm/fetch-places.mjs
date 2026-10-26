// Fetches named places within 15 km of Queenstown from OpenStreetMap (Overpass API) and writes
// backend/seed/places.csv. Places already in the file keep their slugs, and addresses that only say
// "Queenstown" are filled in from reverse-cache.json (reverse.mjs). Run from the repository root:
//   node backend/seed/osm/fetch-places.mjs
// The data is © OpenStreetMap contributors under the ODbL (README.md in this folder).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assignSlugs, existingSlugs, fillAddresses, toCsv, toPlaceRow } from "./mapping.mjs";
import { readReverseCache } from "./reverse-cache.mjs";

const CENTER = { lat: -45.0312, lon: 168.6626 };
const RADIUS_M = 15000;
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const CSV = join(dirname(fileURLToPath(import.meta.url)), "..", "places.csv");

const around = `around:${RADIUS_M},${CENTER.lat},${CENTER.lon}`;
const query = `[out:json][timeout:90];
(
  nw(${around})["name"]["amenity"~"^(restaurant|fast_food|cafe|bar|pub|biergarten|toilets|parking|library|clinic|doctors|hospital|pharmacy)$"];
  nw(${around})["name"]["shop"];
  nw(${around})["name"]["tourism"~"^(attraction|viewpoint|information)$"];
  nw(${around})["name"]["leisure"="park"];
);
out center tags;`;

// Public Overpass servers are often busy (429, 502, 504). They ask for retries with a growing wait,
// so each server is tried a few times, then the next one.
async function overpass() {
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 0, wait = 15_000; attempt < 4; attempt++, wait *= 2) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "QueenstownLocal-seed/1.0 (https://github.com/Nick-ugi/Local-Platform)",
        },
        body: new URLSearchParams({ data: query }),
      }).catch((error) => ({ ok: false, status: error.message, text: async () => "" }));
      if (response.ok) {
        return response.json();
      }
      console.error(`${endpoint} answered ${response.status}; trying again in ${wait / 1000} s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw new Error("No Overpass server answered. Try again later.");
}

const { elements } = await overpass();

const rows = elements
  .map(toPlaceRow)
  .filter(Boolean)
  // A stable order, so a new import changes only the lines that changed.
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.sourceUrl.localeCompare(b.sourceUrl));

let current = "";
try {
  current = readFileSync(CSV, "utf8");
} catch {
  // No file yet: every place is new.
}
const withSlugs = assignSlugs(fillAddresses(rows, readReverseCache()), existingSlugs(current));
writeFileSync(CSV, toCsv(withSlugs));

const counts = {};
for (const row of withSlugs) {
  const key = row.subtype ? `${row.category}/${row.subtype}` : row.category;
  counts[key] = (counts[key] ?? 0) + 1;
}
console.log(`${elements.length} objects from OpenStreetMap, ${withSlugs.length} places written to ${CSV}`);
console.log(counts);
console.log(`Address "Queenstown" only: ${withSlugs.filter((row) => row.address === "Queenstown").length}`);
