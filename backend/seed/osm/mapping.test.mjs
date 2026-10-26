// node --test backend/seed/osm
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  addressFromReverse,
  assignSlugs,
  fillAddresses,
  fromCsv,
  pickReverse,
  slugBase,
  toCsv,
  toPlaceRow,
} from "./mapping.mjs";

const node = (tags, extra = {}) => ({ type: "node", id: 101, lat: -45.0322, lon: 168.661, tags, ...extra });

test("sorts OpenStreetMap tags into the six categories", () => {
  const cases = [
    [{ amenity: "restaurant" }, "food", null],
    [{ amenity: "fast_food" }, "food", null],
    [{ amenity: "cafe" }, "cafe", null],
    [{ amenity: "bar" }, "bar", null],
    [{ amenity: "pub" }, "bar", null],
    [{ amenity: "biergarten" }, "bar", null],
    [{ tourism: "attraction" }, "activity", null],
    [{ tourism: "viewpoint" }, "activity", null],
    [{ leisure: "park" }, "activity", null],
    [{ shop: "outdoor" }, "shopping", null],
    [{ amenity: "toilets" }, "facility", "toilet"],
    [{ amenity: "parking" }, "facility", "parking"],
    [{ tourism: "information", information: "office" }, "facility", "information"],
    [{ amenity: "library" }, "facility", "library"],
    [{ amenity: "pharmacy" }, "facility", "medical"],
    [{ amenity: "doctors" }, "facility", "medical"],
    [{ amenity: "clinic" }, "facility", "medical"],
    [{ amenity: "hospital" }, "facility", "medical"],
  ];
  for (const [tags, category, subtype] of cases) {
    const row = toPlaceRow(node({ name: "Somewhere", ...tags }));
    assert.equal(row?.category, category, JSON.stringify(tags));
    assert.equal(row?.subtype, subtype, JSON.stringify(tags));
  }
});

test("leaves out what has no name or no category of ours", () => {
  assert.equal(toPlaceRow(node({ amenity: "cafe" })), null);
  assert.equal(toPlaceRow(node({ name: "  ", amenity: "cafe" })), null);
  assert.equal(toPlaceRow(node({ name: "Bench", amenity: "bench" })), null);
  assert.equal(toPlaceRow(node({ name: "Board", tourism: "information", information: "board" })), null);
  assert.equal(toPlaceRow(node({ name: "Empty shop", shop: "vacant" })), null);
});

test("takes the centre of a way and the source address of the object", () => {
  const row = toPlaceRow({ type: "way", id: 555, center: { lat: -45.03, lon: 168.66 }, tags: { name: "Park", leisure: "park" } });

  assert.equal(row.latitude, -45.03);
  assert.equal(row.longitude, 168.66);
  assert.equal(row.source, "OpenStreetMap");
  assert.equal(row.sourceUrl, "https://www.openstreetmap.org/way/555");
  assert.equal(row.status, "public");
  assert.equal(row.imageUrl, null);
});

test("builds the address from the addr tags, or says Queenstown", () => {
  const full = { "addr:housenumber": "12", "addr:street": "Beach Street", "addr:city": "Queenstown" };
  assert.equal(toPlaceRow(node({ name: "A", amenity: "cafe", ...full })).address, "12 Beach Street, Queenstown");
  assert.equal(
    toPlaceRow(node({ name: "A", amenity: "cafe", "addr:street": "Grant Road", "addr:suburb": "Frankton" })).address,
    "Grant Road, Frankton",
  );
  assert.equal(toPlaceRow(node({ name: "A", amenity: "cafe" })).address, "Queenstown");
});

test("fits the values to the place table", () => {
  const row = toPlaceRow(
    node({
      name: "N".repeat(130),
      amenity: "cafe",
      "addr:street": "S".repeat(300),
      phone: "+64 3 000 0000 ext 1234567890123456789",
      opening_hours: "Mo-Su 08:00-16:00",
      website: "www.example.com",
    }),
  );

  assert.equal(row.name.length, 120);
  assert.equal(row.address.length, 255);
  assert.equal(row.phone, null, "a cut phone number would be wrong, so it is left out");
  assert.equal(row.openingHours, "Mo-Su 08:00-16:00");
  assert.equal(row.website, null, "only http(s) addresses");
  assert.equal(toPlaceRow(node({ name: "A", amenity: "cafe", website: "ftp://x.example" })).website, null);
  assert.equal(
    toPlaceRow(node({ name: "A", amenity: "cafe", "contact:website": "https://x.example/menu" })).website,
    "https://x.example/menu",
  );
});

test("puts each value on one line", () => {
  const row = toPlaceRow(node({ name: "Two\nlines\tname", amenity: "cafe" }));

  assert.equal(row.name, "Two lines name");
});

test("makes slugs as the API does", () => {
  assert.equal(slugBase("Café Ōtautahi & Co."), "cafe-otautahi-co");
  assert.equal(slugBase("!!!"), "place");
  assert.ok(slugBase("x".repeat(200)).length <= 114);
});

test("keeps the slug a place already has and numbers new names that are taken", () => {
  const rows = [
    { name: "Fergburger", sourceUrl: "https://www.openstreetmap.org/node/1" },
    { name: "Fergburger", sourceUrl: "https://www.openstreetmap.org/node/2" },
    { name: "Fergburger", sourceUrl: "https://www.openstreetmap.org/node/3" },
  ];
  const existing = new Map([["https://www.openstreetmap.org/node/2", "fergburger"]]);

  const slugs = assignSlugs(rows, existing).map((row) => row.slug);

  assert.deepEqual(slugs, ["fergburger-2", "fergburger", "fergburger-3"]);
});

test("writes the CSV of backend/seed/places.csv", () => {
  const csv = toCsv([
    {
      slug: "fish-chips",
      name: 'Fish, "Chips"',
      category: "food",
      subtype: null,
      description: null,
      address: "Queenstown",
      latitude: -45.0322,
      longitude: 168.661,
      openingHours: null,
      phone: null,
      website: null,
      imageUrl: null,
      source: "OpenStreetMap",
      sourceUrl: "https://www.openstreetmap.org/node/1",
      status: "public",
    },
  ]);

  assert.equal(
    csv,
    "slug,name,category,subtype,description,address,latitude,longitude,opening_hours,phone,website,image_url,source,source_url,status\n" +
      'fish-chips,"Fish, ""Chips""",food,,,Queenstown,-45.0322,168.661,,,,,OpenStreetMap,https://www.openstreetmap.org/node/1,public\n',
  );
});

// A place by the lake, and what Nominatim's reverse lookup says is there.
const place = { latitude: -45.0322, longitude: 168.661, address: "Queenstown" };
const reverse = (address, lat = "-45.0322", lon = "168.661") => ({ lat, lon, address });

test("an address from Nominatim: number and road, then the town, or the suburb where there is no town", () => {
  assert.equal(
    addressFromReverse(reverse({ house_number: "12", road: "Beach Street", town: "Queenstown" }), place),
    "12 Beach Street, Queenstown",
  );
  // Nominatim calls central Queenstown "Boydtown", which visitors would not know.
  assert.equal(
    addressFromReverse(reverse({ road: "Athol Street", suburb: "Boydtown", town: "Queenstown" }), place),
    "Athol Street, Queenstown",
  );
  assert.equal(addressFromReverse(reverse({ road: "Grant Road", suburb: "Frankton" }), place), "Grant Road, Frankton");
  assert.equal(addressFromReverse(reverse({ road: "Arthurs Point Road", village: "Arthurs Point" }), place), "Arthurs Point Road, Arthurs Point");
  assert.equal(addressFromReverse(reverse({ road: "Malaghans Road" }), place), "Malaghans Road");
});

test("no address without a road, or from a result more than 50 m from the place", () => {
  assert.equal(addressFromReverse(reverse({ town: "Queenstown" }), place), null);
  assert.equal(addressFromReverse(null, place), null);
  // About 60 m north, and about 40 m north.
  const road = { road: "Beach Street", town: "Queenstown" };
  assert.equal(addressFromReverse(reverse(road, "-45.03166", "168.661"), place), null);
  assert.equal(addressFromReverse(reverse(road, "-45.03184", "168.661"), place), "Beach Street, Queenstown");
});

test("keeps only the parts of a Nominatim answer the address needs, and nothing when it found nothing", () => {
  const answer = {
    place_id: 1,
    lat: "-45.0322",
    lon: "168.661",
    display_name: "Lakeside, 12, Beach Street, Queenstown, Otago, 9300, New Zealand",
    address: { amenity: "Lakeside", house_number: "12", road: "Beach Street", town: "Queenstown", postcode: "9300" },
  };

  assert.deepEqual(pickReverse(answer), {
    lat: "-45.0322",
    lon: "168.661",
    address: { house_number: "12", road: "Beach Street", town: "Queenstown" },
  });
  assert.equal(pickReverse({ error: "Unable to geocode" }), null);
});

test("fills in only the addresses that say Queenstown, from the cache by source address", () => {
  const rows = [
    { ...place, sourceUrl: "https://www.openstreetmap.org/node/1" },
    { ...place, sourceUrl: "https://www.openstreetmap.org/node/2" },
    { ...place, sourceUrl: "https://www.openstreetmap.org/node/3", address: "5 Athol Street" },
    { ...place, sourceUrl: "https://www.openstreetmap.org/node/4" },
  ];
  const cache = {
    "https://www.openstreetmap.org/node/1": reverse({ road: "Beach Street", town: "Queenstown" }),
    "https://www.openstreetmap.org/node/2": null,
    "https://www.openstreetmap.org/node/3": reverse({ road: "Beach Street", town: "Queenstown" }),
  };

  assert.deepEqual(
    fillAddresses(rows, cache).map((row) => row.address),
    ["Beach Street, Queenstown", "Queenstown", "5 Athol Street", "Queenstown"],
  );
});

test("reads places.csv back exactly as it was written", () => {
  const text = readFileSync(new URL("../places.csv", import.meta.url), "utf8");
  const rows = fromCsv(text);

  assert.equal(rows.length, text.trim().split("\n").length - 1);
  assert.equal(rows[0].source, "OpenStreetMap");
  assert.equal(toCsv(rows), text);
});
