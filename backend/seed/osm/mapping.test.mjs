// node --test backend/seed/osm
import assert from "node:assert/strict";
import { test } from "node:test";
import { assignSlugs, slugBase, toCsv, toPlaceRow } from "./mapping.mjs";

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
