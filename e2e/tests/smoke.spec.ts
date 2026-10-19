import { expect, test } from "@playwright/test";

/**
 * A quick look at a deployment after it goes out, reading only (WEB_URL, ADMIN_URL). It uses the
 * data the deployment already has and changes nothing.
 */

const ADMIN = process.env.ADMIN_URL;

test("the map draws", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Show my location" })).toBeVisible();
  await expect(page.getByText("The map isn't available right now.")).toHaveCount(0);
  await expect(page.getByText("We couldn't load the map data.")).toHaveCount(0);
});

test("Explore lists places and a place opens with its server-rendered page", async ({ page, request, baseURL }) => {
  await page.goto("/explore");
  const first = page.locator('a[href^="/places/"]').first();
  await expect(first).toBeVisible();
  const href = await first.getAttribute("href");

  await first.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const html = await (await request.get(href!)).text();
  expect(html).toContain(`<link rel="canonical" href="${baseURL}${href}"/>`);
  expect(html).toMatch(/<meta property="og:title"/);
});

test("the local lists, the legal pages and the sitemap answer", async ({ request }) => {
  for (const path of ["/notices", "/events", "/about", "/privacy", "/terms", "/sitemap.xml", "/robots.txt"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("a missing place is a real 404", async ({ request }) => {
  expect((await request.get("/places/this-place-does-not-exist")).status()).toBe(404);
});

test("the admin opens on its Log in and reaches the API", async ({ page, request }) => {
  test.skip(!ADMIN, "ADMIN_URL is not set");

  await page.goto(`${ADMIN}/places`);
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  // Through the admin's own address, as the browser calls it.
  expect((await request.get(`${ADMIN}/api/v1/places?size=1`)).status()).toBe(200);
});
