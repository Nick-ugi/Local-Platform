import type { Category, MapMarker } from "@queenstown/shared";
import { expect, test } from "vitest";
import { toFeatureCollection } from "./geojson";

function marker(slug: string, category: Category): MapMarker {
  return {
    kind: "place",
    slug,
    latitude: -45.0322,
    longitude: 168.661,
    name: slug,
    category,
    subtype: category === "facility" ? "toilet" : null,
  };
}

test("puts longitude first", () => {
  const [feature] = toFeatureCollection([marker("lakeside-kitchen", "food")]).features;

  expect(feature.geometry).toEqual({ type: "Point", coordinates: [168.661, -45.0322] });
});

test("carries what the layers need", () => {
  const collection = toFeatureCollection([
    marker("a", "food"),
    marker("b", "cafe"),
    marker("c", "bar"),
    marker("d", "activity"),
    marker("e", "shopping"),
    marker("f", "facility"),
  ]);

  expect(collection.type).toBe("FeatureCollection");
  expect(collection.features.map((feature) => feature.type)).toEqual(Array(6).fill("Feature"));
  expect(collection.features.map((feature) => feature.properties)).toEqual([
    { slug: "a", category: "food", subtype: null, label: "F" },
    { slug: "b", category: "cafe", subtype: null, label: "C" },
    { slug: "c", category: "bar", subtype: null, label: "B" },
    { slug: "d", category: "activity", subtype: null, label: "A" },
    { slug: "e", category: "shopping", subtype: null, label: "S" },
    { slug: "f", category: "facility", subtype: "toilet", label: "P" },
  ]);
});

test("an empty list is an empty collection", () => {
  expect(toFeatureCollection([])).toEqual({ type: "FeatureCollection", features: [] });
});
