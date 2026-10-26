import { Linking, Platform, Share } from "react-native";
import { call, contactEmail, emailOperator, openDirections, openWebsite, shareLink, webUrl } from "../actions";

const openURL = jest.spyOn(Linking, "openURL");
const share = jest.spyOn(Share, "share");

beforeEach(() => {
  openURL.mockReset();
  openURL.mockResolvedValue(true);
  share.mockReset();
  share.mockResolvedValue({ action: Share.sharedAction });
  delete process.env.EXPO_PUBLIC_SITE_URL;
  Platform.OS = "android";
});

test("the web address comes from EXPO_PUBLIC_SITE_URL, or the local web app", () => {
  expect(webUrl("/places/harbour-coffee")).toBe("http://localhost:3001/places/harbour-coffee");

  process.env.EXPO_PUBLIC_SITE_URL = "https://queenstownlocal.example/";
  expect(webUrl("/places/harbour-coffee")).toBe("https://queenstownlocal.example/places/harbour-coffee");
});

test("the operator's address is one usable address from EXPO_PUBLIC_CONTACT_EMAIL, or none", async () => {
  try {
    delete process.env.EXPO_PUBLIC_CONTACT_EMAIL;
    expect(contactEmail()).toBeNull();
    expect(await emailOperator("Hi", "There")).toBe(false);
    expect(openURL).not.toHaveBeenCalled();

    for (const unusable of ["", "  ", "hello", "hello@localhost", "two words@queenstown.example", "a@b@c.nz"]) {
      process.env.EXPO_PUBLIC_CONTACT_EMAIL = unusable;
      expect(contactEmail()).toBeNull();
    }

    process.env.EXPO_PUBLIC_CONTACT_EMAIL = " hello@queenstown.example ";
    expect(contactEmail()).toBe("hello@queenstown.example");
    expect(await emailOperator("Hi there", "A & B")).toBe(true);
    expect(openURL).toHaveBeenCalledWith("mailto:hello@queenstown.example?subject=Hi%20there&body=A%20%26%20B");
  } finally {
    delete process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  }
});

test("calls a number that can be dialled, and not one that cannot", async () => {
  await expect(call("+64 3 441 0000")).resolves.toBe(true);
  expect(openURL).toHaveBeenCalledWith("tel:+6434410000");

  openURL.mockClear();
  await expect(call("ask at the bar")).resolves.toBe(false);
  expect(openURL).not.toHaveBeenCalled();
});

test("opens only http(s) websites", async () => {
  await expect(openWebsite("https://harbourcoffee.example")).resolves.toBe(true);
  expect(openURL).toHaveBeenCalledWith("https://harbourcoffee.example");

  openURL.mockClear();
  await expect(openWebsite("javascript:alert(1)")).resolves.toBe(false);
  expect(openURL).not.toHaveBeenCalled();
});

test("a phone that cannot open the address says so", async () => {
  openURL.mockRejectedValue(new Error("No app"));

  await expect(openWebsite("https://harbourcoffee.example")).resolves.toBe(false);
});

test("directions open the maps app on Android", async () => {
  await openDirections({ latitude: -45.0335, longitude: 168.659 }, "Harbour Coffee");

  expect(openURL).toHaveBeenCalledWith("geo:-45.0335,168.659?q=-45.0335,168.659(Harbour%20Coffee)");
});

test("directions open Apple Maps on iOS", async () => {
  Platform.OS = "ios";

  await openDirections({ latitude: -45.0335, longitude: 168.659 }, "Harbour Coffee");

  expect(openURL).toHaveBeenCalledWith("https://maps.apple.com/?daddr=-45.0335,168.659");
});

test("directions fall back to Google Maps when the maps app does not open", async () => {
  openURL.mockRejectedValueOnce(new Error("No maps app"));

  await expect(openDirections({ latitude: -45.0335, longitude: 168.659 }, "Harbour Coffee")).resolves.toBe(true);

  expect(openURL).toHaveBeenLastCalledWith(
    "https://www.google.com/maps/dir/?api=1&destination=-45.0335,168.659",
  );
});

test("shares the web address with the phone's share sheet", async () => {
  await expect(shareLink("Harbour Coffee", "/places/harbour-coffee")).resolves.toBe(true);

  expect(share).toHaveBeenCalledWith({
    title: "Harbour Coffee",
    message: "Harbour Coffee\nhttp://localhost:3001/places/harbour-coffee",
  });
});

test("a share that fails says so", async () => {
  share.mockRejectedValue(new Error("No sheet"));

  await expect(shareLink("Harbour Coffee", "/places/harbour-coffee")).resolves.toBe(false);
});
