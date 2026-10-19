import { readFileSync } from "node:fs";
import { type Browser, type Page, expect, test } from "@playwright/test";

/**
 * The whole story on the local server stack (deploy/compose.yaml on *.lvh.me), in order: the admin
 * registers a place, an event and a notice (S5), visitors find them on the web (S1 to S4), sign up and
 * keep a favourite, the log in limit answers, and a place taken private disappears.
 * Run `npm run make-admin -w e2e` first.
 */

const ADMIN = process.env.ADMIN_URL ?? "https://admin.lvh.me";
const API = process.env.API_URL ?? "https://api.lvh.me";
const admin = JSON.parse(readFileSync(new URL("../.auth/admin.json", import.meta.url), "utf8")) as {
  email: string;
  password: string;
};

// One run's items, so runs never meet: E2E Cafe k3x9 → e2e-cafe-k3x9 (the API's slug rule).
const RUN = Date.now().toString(36);
const place = { name: `E2E Cafe ${RUN}`, slug: `e2e-cafe-${RUN}` };
const event = { title: `E2E Market ${RUN}`, slug: `e2e-market-${RUN}` };
const notice = { title: `E2E Road Works ${RUN}`, slug: `e2e-road-works-${RUN}` };

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** "2026-10-19T17:00" in New Zealand, as the admin's date and time fields take it. */
function nzLocal(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** "19 Oct" in New Zealand, as the web shows dates. */
function nzDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", { timeZone: "Pacific/Auckland", day: "numeric", month: "short" }).format(date);
}

/** A text field of the admin by its label. Labels show " *" for required fields, hidden from the accessible name. */
function field(page: Page, name: string) {
  return page.getByRole("textbox", { name, exact: true });
}

async function adminLogIn(page: Page, account: { email: string; password: string }) {
  await page.goto(`${ADMIN}/login`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

async function save(page: Page, list: string) {
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(new RegExp(`${ADMIN}/${list}(\\?|$)`));
}

async function newAdminPage(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  await adminLogIn(page, admin);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  return page;
}

test.describe.configure({ mode: "serial" });

let adminPage: Page;
/** Set once S5 has saved the event and the notice, which afterAll then takes private. */
let registered = false;

test.beforeAll(async ({ browser }) => {
  adminPage = await newAdminPage(browser);
});

test("S5: the admin registers a place, an event and a notice", async () => {
  const page = adminPage;
  const now = Date.now();

  await page.goto(`${ADMIN}/places/new`);
  await field(page, "Name").fill(place.name);
  await page.getByRole("combobox", { name: "Category" }).selectOption("cafe");
  await field(page, "Address").fill("1 Marine Parade, Queenstown");
  await page.getByRole("spinbutton", { name: "Latitude" }).fill("-45.0329");
  await page.getByRole("spinbutton", { name: "Longitude" }).fill("168.6598");
  await field(page, "Source").fill("E2E test");
  await field(page, "Source URL").fill("https://example.com/e2e-cafe");
  await page.getByRole("radio", { name: "Public" }).check();
  await save(page, "places");
  await expect(page.getByRole("link", { name: place.name })).toBeVisible();

  await page.goto(`${ADMIN}/events/new`);
  await field(page, "Title").fill(event.title);
  await field(page, "Starts (NZ time)").fill(nzLocal(new Date(now + HOUR)));
  await field(page, "Ends (NZ time, optional)").fill(nzLocal(new Date(now + 3 * HOUR)));
  await field(page, "Venue").fill("Earnslaw Park");
  await page.getByRole("spinbutton", { name: "Latitude" }).fill("-45.0331");
  await page.getByRole("spinbutton", { name: "Longitude" }).fill("168.6597");
  await field(page, "Source").fill("E2E test");
  await field(page, "Official event page").fill("https://example.com/e2e-market");
  await page.getByRole("radio", { name: "Public" }).check();
  await save(page, "events");
  await expect(page.getByRole("link", { name: event.title })).toBeVisible();

  await page.goto(`${ADMIN}/notices/new`);
  await field(page, "Title").fill(notice.title);
  await page.getByRole("combobox", { name: "Type" }).selectOption("road-work");
  await field(page, "From (NZ time)").fill(nzLocal(new Date(now - DAY)));
  await field(page, "Until (NZ time, optional)").fill(nzLocal(new Date(now + 7 * DAY)));
  await field(page, "Summary").fill("Lane closures during the day.");
  await field(page, "Location name").fill("Shotover Street");
  await page.getByRole("spinbutton", { name: "Latitude" }).fill("-45.0303");
  await page.getByRole("spinbutton", { name: "Longitude" }).fill("168.6612");
  await field(page, "Source organisation").fill("Queenstown Lakes District Council");
  await field(page, "Original URL").fill("https://example.com/e2e-works");
  await page.getByRole("checkbox", { name: /Official/ }).check();
  await page.getByRole("radio", { name: "Public" }).check();
  await save(page, "notices");
  await expect(page.getByRole("link", { name: notice.title })).toBeVisible();
  registered = true;
});

test("S5: an ordinary account cannot use the admin", async ({ browser, request }) => {
  const user = { email: `e2e-user-${RUN}@check.test`, password: `user-password-${RUN}` };
  expect((await request.post(`${API}/api/v1/auth/signup`, { data: user })).status()).toBe(201);

  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage();
  await adminLogIn(page, user);

  await expect(page.getByRole("alert")).toHaveText("This account cannot use the admin.");
});

test("S1: the place from a shared map link opens its card, its details and directions", async ({ page }) => {
  await page.goto(`/?filter=cafe&place=${place.slug}`);
  await expect(page.getByText(place.name).first()).toBeVisible();

  await page.getByRole("link", { name: "View details" }).click();

  await expect(page).toHaveURL(new RegExp(`/places/${place.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: place.name })).toBeVisible();
  await expect(page.getByRole("link", { name: "Directions" })).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\//);
});

test("S2: the notice is in the list with its New Zealand dates and goes to the map", async ({ page }) => {
  await page.goto("/notices");
  await page.getByRole("link", { name: new RegExp(notice.title) }).click();

  await expect(page.getByRole("heading", { level: 1, name: notice.title })).toBeVisible();
  await expect(page.getByText("Official").first()).toBeVisible();
  await expect(page.getByText(new RegExp(nzDayMonth(new Date(Date.now() - DAY))))).toBeVisible();
  await expect(page.getByRole("link", { name: "View on map" })).toHaveAttribute("href", new RegExp(`notice=${notice.slug}`));
});

test("S3: the event is in this week's list and goes to the map", async ({ page }) => {
  await page.goto("/events?when=week");
  await page.getByRole("link", { name: new RegExp(event.title) }).click();

  await expect(page.getByRole("heading", { level: 1, name: event.title })).toBeVisible();
  await expect(page.getByRole("link", { name: "View on map" })).toHaveAttribute("href", new RegExp(`event=${event.slug}`));
});

test("S4: the place's address answers with its content and tags from the server", async ({ request, baseURL }) => {
  const response = await request.get(`/places/${place.slug}`);
  const html = await response.text();

  expect(response.status()).toBe(200);
  expect(html).toContain(`<title>${place.name} | Queenstown Local</title>`);
  expect(html).toMatch(new RegExp(`<meta property="og:title" content="${place.name}"`));
  expect(html).toContain(`<link rel="canonical" href="${baseURL}/places/${place.slug}"/>`);
  expect(html).toContain("1 Marine Parade, Queenstown");
});

test("a visitor saves the place on the way through sign up, then removes it and logs out", async ({ page }) => {
  await page.goto(`/places/${place.slug}`);
  await page.getByRole("button", { name: "Save to favorites" }).click();
  await expect(page).toHaveURL(/\/login\?next=/);

  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Email").fill(`e2e-visitor-${RUN}@check.test`);
  await page.getByLabel("Password").fill(`visitor-password-${RUN}`);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(new RegExp(`/places/${place.slug}`));
  await expect(page.getByRole("button", { name: "Saved to favorites" })).toBeVisible();

  await page.goto("/favorites");
  await expect(page.getByText(place.name)).toBeVisible();
  await page.getByRole("button", { name: `Remove ${place.name} from favorites` }).click();
  await expect(page.getByText(/No saved places yet/)).toBeVisible();

  await page.goto("/more");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
});

test("too many wrong passwords for one account are refused with a message", async ({ page }) => {
  const email = `e2e-limit-${RUN}@check.test`;
  for (let i = 0; i < 20; i++) {
    const response = await page.request.post("/api/auth/login", { data: { email, password: "wrong-password" } });
    expect(response.status()).toBe(401);
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  // Next.js also keeps an empty role=alert (its route announcer), so the message is found by its text.
  await expect(page.getByRole("alert").filter({ hasText: "Too many tries" })).toHaveText(
    "Too many tries. Wait a few minutes and try again.",
  );
});

test("a place the admin makes private is gone from the web", async ({ page, request }) => {
  await adminPage.goto(`${ADMIN}/places`);
  await adminPage.getByRole("link", { name: place.name }).click();
  await adminPage.getByRole("radio", { name: "Private" }).check();
  await save(adminPage, "places");

  expect((await request.get(`/places/${place.slug}`)).status()).toBe(404);
  await page.goto("/explore/cafe");
  await expect(page.getByRole("heading", { level: 1, name: "Cafes" })).toBeVisible();
  await expect(page.getByText(place.name)).toHaveCount(0);
});

test.afterAll(async () => {
  if (!registered) return;
  // Leave nothing public behind: the event and the notice go private too.
  for (const [list, name] of [
    ["events", event.title],
    ["notices", notice.title],
  ]) {
    await adminPage.goto(`${ADMIN}/${list}`);
    await adminPage.getByRole("link", { name }).click();
    await adminPage.getByRole("radio", { name: "Private" }).check();
    await save(adminPage, list);
  }
});
