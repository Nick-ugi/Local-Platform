import { afterEach, expect, test, vi } from "vitest";
import { contactEmail, mailtoHref } from "./contact";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("reads CONTACT_EMAIL", () => {
  vi.stubEnv("CONTACT_EMAIL", " hello@queenstownlocal.example ");

  expect(contactEmail()).toBe("hello@queenstownlocal.example");
});

test.each([undefined, "", "   ", "not an email", "a@b", "two words@example.com"])(
  "has no contact address for %j",
  (value) => {
    if (value !== undefined) vi.stubEnv("CONTACT_EMAIL", value);

    expect(contactEmail()).toBeNull();
  },
);

test("writes a mailto link with the subject and body encoded", () => {
  const href = mailtoHref("hello@queenstownlocal.example", "Suggest an edit: Fish & Chips #1 김치", "Place: https://x.example/places/a?b=c\nWhat should change?");

  expect(href).toBe(
    "mailto:hello@queenstownlocal.example" +
      "?subject=Suggest%20an%20edit%3A%20Fish%20%26%20Chips%20%231%20%EA%B9%80%EC%B9%98" +
      "&body=Place%3A%20https%3A%2F%2Fx.example%2Fplaces%2Fa%3Fb%3Dc%0AWhat%20should%20change%3F",
  );
});

test("has no link without an address", () => {
  expect(mailtoHref(null, "subject", "body")).toBeNull();
});
