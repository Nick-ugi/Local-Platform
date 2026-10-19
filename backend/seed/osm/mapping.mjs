// Turns OpenStreetMap objects (Overpass API, "out center tags") into rows of backend/seed/places.csv.
// The rules are those of seed/README.md and the place table (V1__init_schema.sql): a row that would
// be refused is left out or its value dropped here, because one refused row stops the whole load.

const OSM = "https://www.openstreetmap.org";

const MEDICAL = new Set(["clinic", "doctors", "hospital", "pharmacy"]);

/** [category, subtype] for the tags, or null when the object is none of ours. */
function classify(tags) {
  const amenity = tags.amenity;
  if (amenity === "restaurant" || amenity === "fast_food") return ["food", null];
  if (amenity === "cafe") return ["cafe", null];
  if (amenity === "bar" || amenity === "pub" || amenity === "biergarten") return ["bar", null];
  if (amenity === "toilets") return ["facility", "toilet"];
  if (amenity === "parking") return ["facility", "parking"];
  if (amenity === "library") return ["facility", "library"];
  if (MEDICAL.has(amenity)) return ["facility", "medical"];
  if (tags.tourism === "information") return tags.information === "office" ? ["facility", "information"] : null;
  if (tags.tourism === "attraction" || tags.tourism === "viewpoint" || tags.leisure === "park") {
    return ["activity", null];
  }
  if (tags.shop && tags.shop !== "vacant") return ["shopping", null];
  return null;
}

/** The value on one line, without outer spaces; null when nothing is left. */
function clean(value) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}

/** The value when it fits the column, otherwise null: a cut phone number or hour would be wrong. */
function fitOrDrop(value, max) {
  return value && value.length <= max ? value : null;
}

function webAddress(value) {
  const url = clean(value);
  return url && /^https?:\/\//i.test(url) && url.length <= 500 ? url : null;
}

function address(tags) {
  const street = [clean(tags["addr:housenumber"]), clean(tags["addr:street"])].filter(Boolean).join(" ");
  const locality = clean(tags["addr:suburb"]) ?? clean(tags["addr:city"]);
  const text = street ? (locality ? `${street}, ${locality}` : street) : (locality ?? "Queenstown");
  return text.slice(0, 255);
}

/** A row for places.csv without its slug (assignSlugs adds it), or null. */
export function toPlaceRow(element) {
  const tags = element.tags ?? {};
  const name = clean(tags.name);
  const kind = classify(tags);
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!name || !kind || typeof lat !== "number" || typeof lon !== "number") {
    return null;
  }
  const [category, subtype] = kind;
  return {
    name: name.slice(0, 120),
    category,
    subtype,
    description: null,
    address: address(tags),
    latitude: Number(lat.toFixed(7)),
    longitude: Number(lon.toFixed(7)),
    openingHours: fitOrDrop(clean(tags.opening_hours), 255),
    phone: fitOrDrop(clean(tags.phone ?? tags["contact:phone"]), 30),
    website: webAddress(tags.website ?? tags["contact:website"]),
    imageUrl: null,
    source: "OpenStreetMap",
    sourceUrl: `${OSM}/${element.type}/${element.id}`,
    status: "public",
  };
}

/**
 * The slug of a name, as the API makes them (backend common/slug/Slugs.java): lower case letters
 * and digits joined by hyphens, room left for a number, "place" when nothing is left.
 */
export function slugBase(name) {
  let plain = name
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (plain.length > 114) plain = plain.slice(0, 114).replace(/-+$/, "");
  return plain || "place";
}

/**
 * Adds slugs. A place already in places.csv keeps its slug (found by its source address), because a
 * published slug never changes (seed/README.md). A new place gets the slug of its name, numbered
 * "-2", "-3" and so on when that is taken.
 */
export function assignSlugs(rows, existingSlugBySourceUrl) {
  const taken = new Set();
  const slugs = rows.map((row) => {
    const kept = existingSlugBySourceUrl.get(row.sourceUrl);
    if (kept) taken.add(kept);
    return kept ?? null;
  });
  return rows.map((row, i) => {
    let slug = slugs[i];
    if (!slug) {
      const base = slugBase(row.name);
      slug = base;
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
      taken.add(slug);
    }
    return { slug, ...row };
  });
}

const COLUMNS = [
  ["slug", "slug"],
  ["name", "name"],
  ["category", "category"],
  ["subtype", "subtype"],
  ["description", "description"],
  ["address", "address"],
  ["latitude", "latitude"],
  ["longitude", "longitude"],
  ["opening_hours", "openingHours"],
  ["phone", "phone"],
  ["website", "website"],
  ["image_url", "imageUrl"],
  ["source", "source"],
  ["source_url", "sourceUrl"],
  ["status", "status"],
];

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** places.csv: the header, then one line per row. */
export function toCsv(rows) {
  const header = COLUMNS.map(([column]) => column).join(",");
  const lines = rows.map((row) => COLUMNS.map(([, key]) => csvValue(row[key])).join(","));
  return [header, ...lines].join("\n") + "\n";
}

/** source_url → slug from the current places.csv, so a new import keeps the published slugs. */
export function existingSlugs(csvText) {
  const map = new Map();
  for (const line of csvText.split(/\r?\n/).slice(1)) {
    if (!line) continue;
    const fields = parseCsvLine(line);
    const slug = fields[0];
    const sourceUrl = fields[13];
    if (slug && sourceUrl) map.set(sourceUrl, slug);
  }
  return map;
}

function parseCsvLine(line) {
  const fields = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        value += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        value += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      fields.push(value);
      value = "";
    } else {
      value += c;
    }
  }
  fields.push(value);
  return fields;
}
