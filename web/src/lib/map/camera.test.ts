import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DEFAULT_CAMERA, loadCamera, saveCamera } from "./camera";

beforeEach(() => {
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("starts on Queenstown", () => {
  expect(loadCamera()).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(DEFAULT_CAMERA).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
});

test("returns what was saved", () => {
  const frankton = { latitude: -45.0195, longitude: 168.732, zoom: 12.5 };

  saveCamera(frankton);

  expect(loadCamera()).toEqual(frankton);
});

test.each([
  ["cut-off JSON", '{"latitude":"x"'],
  ["a text where a number belongs", '{"latitude":"x","longitude":168.7,"zoom":12}'],
  ["a latitude off the globe", '{"latitude":-95,"longitude":168.7,"zoom":12}'],
  ["a longitude off the globe", '{"latitude":-45,"longitude":190,"zoom":12}'],
  ["a zoom no map has", '{"latitude":-45,"longitude":168.7,"zoom":99}'],
  ["a missing field", '{"latitude":-45,"longitude":168.7}'],
  ["something that is not an object", "null"],
])("ignores a damaged value: %s", (_name, stored) => {
  window.sessionStorage.setItem("map.camera", stored);

  expect(loadCamera()).toEqual(DEFAULT_CAMERA);
});

test("works without session storage", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("The operation is insecure.", "SecurityError");
  });

  expect(() => saveCamera({ latitude: -45.0195, longitude: 168.732, zoom: 12 })).not.toThrow();
  expect(loadCamera()).toEqual(DEFAULT_CAMERA);
});
