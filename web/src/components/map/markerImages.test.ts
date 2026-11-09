import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MARKER_ICON_PIXEL_RATIO, MARKER_ICONS } from "@queenstown/shared";
import { expect, test } from "vitest";

test("every marker picture is in public/markers: a 16 pt PNG with transparency, as the app has", () => {
  for (const icon of MARKER_ICONS) {
    const png = readFileSync(resolve(process.cwd(), `public/markers/${icon}.png`));
    const mobile = readFileSync(resolve(process.cwd(), `../mobile/assets/markers/${icon}.png`));

    expect(png.subarray(1, 4).toString(), icon).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)], icon).toEqual([16 * MARKER_ICON_PIXEL_RATIO, 16 * MARKER_ICON_PIXEL_RATIO]);
    // Colour type 6: red, green, blue and alpha.
    expect(png[25], icon).toBe(6);
    // Both apps draw the same pictures (mobile/assets/markers/make-markers.ps1 writes both).
    expect(png.equals(mobile), icon).toBe(true);
  }
});
