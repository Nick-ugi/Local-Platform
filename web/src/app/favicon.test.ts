import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

test("favicon.ico holds 16 and 32 pixel PNGs with an alpha channel, which Next.js can read", () => {
  const ico = readFileSync(resolve(process.cwd(), "src/app/favicon.ico"));
  const count = ico.readUInt16LE(4);
  const images = Array.from({ length: count }, (_, i) => {
    const entry = 6 + 16 * i;
    const png = ico.subarray(ico.readUInt32LE(entry + 12), ico.readUInt32LE(entry + 12) + ico.readUInt32LE(entry + 8));
    // An RGB PNG (colour type 2) fails the dev server and the build with "The PNG is not in RGBA format".
    return { width: png.readUInt32BE(16), colourType: png[25] };
  });

  expect(images).toEqual([
    { width: 16, colourType: 6 },
    { width: 32, colourType: 6 },
  ]);
});
