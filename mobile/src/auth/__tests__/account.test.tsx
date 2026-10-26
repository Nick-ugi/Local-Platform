import type { PlaceSummary } from "@queenstown/shared";
import { act, fireEvent, screen } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { renderScreen } from "@/test/render";
import { AuthScreen } from "../AuthScreen";
import { FavoriteButton } from "../FavoriteButton";
import { FavoritesScreen } from "../FavoritesScreen";
import { resetForTests } from "../session";

jest.mock("@/geo/location", () => ({ locate: () => new Promise(() => {}) }));

const items = (SecureStore as unknown as { __items: Map<string, string> }).__items;
const fetchMock = jest.fn();
type Call = { method: string; url: string; body: unknown };
let calls: Call[] = [];

function api(answer: (call: Call) => { status: number; body?: unknown }) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit = {}) => {
    const call = {
      method: init.method ?? "GET",
      url: url.replace("http://10.0.2.2:8080/api/v1", ""),
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const { status, body } = answer(call);
    return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body ?? "") };
  });
}

const tokens = { accessToken: "a", refreshToken: "r", expiresIn: 900, user: { email: "kiri@example.com", role: "user" } };

const coffee: PlaceSummary = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: null,
  latitude: -45.0335,
  longitude: 168.659,
  distanceM: null,
  openingHours: null,
};

/** A visitor who signed in earlier: the app restores the session as it starts. */
function signedInBefore() {
  items.set("auth.refreshToken", "r0");
}

async function settle() {
  await act(async () => {});
}

beforeEach(() => {
  resetForTests();
  items.clear();
  calls = [];
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});

test("logging in signs in and goes back", async () => {
  api(() => ({ status: 200, body: tokens }));
  const onDone = jest.fn();
  renderScreen(<AuthScreen mode="login" onDone={onDone} onSwitch={jest.fn()} />);
  await settle();

  fireEvent.changeText(screen.getByLabelText("Email"), " kiri@example.com ");
  fireEvent.changeText(screen.getByLabelText("Password"), "correct horse");
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Log in" })));

  expect(calls[0]).toEqual({ method: "POST", url: "/auth/login", body: { email: "kiri@example.com", password: "correct horse" } });
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(items.get("auth.refreshToken")).toBe("r");
});

test("a wrong password says so, and sign up explains a used email", async () => {
  api(() => ({ status: 401, body: { code: "INVALID_CREDENTIALS", detail: "x" } }));
  const view = renderScreen(<AuthScreen mode="login" onDone={jest.fn()} onSwitch={jest.fn()} />);
  await settle();
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Log in" })));
  expect(screen.getByText("The email or password is wrong.")).toBeOnTheScreen();
  view.unmount();

  api(() => ({ status: 409, body: { code: "EMAIL_ALREADY_USED", detail: "x" } }));
  const onSwitch = jest.fn();
  renderScreen(<AuthScreen mode="signup" onDone={jest.fn()} onSwitch={onSwitch} />);
  await settle();
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Create account" })));
  expect(screen.getByText(/already has an account/)).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("link", { name: "Log in" }));
  expect(onSwitch).toHaveBeenCalledTimes(1);
});

test("the heart sends a visitor to Log in, and saves the place once they are back", async () => {
  api(({ url, method }) => {
    if (url === "/auth/login") return { status: 200, body: tokens };
    if (method === "GET") return { status: 200, body: { items: [] } };
    return { status: 204 };
  });
  const onNeedLogin = jest.fn();
  renderScreen(
    <>
      <FavoriteButton slug="harbour-coffee" onNeedLogin={onNeedLogin} />
      <AuthScreen mode="login" onDone={jest.fn()} onSwitch={jest.fn()} />
    </>,
  );
  await settle();

  fireEvent.press(screen.getByRole("button", { name: "Save to favorites" }));
  expect(onNeedLogin).toHaveBeenCalledTimes(1);

  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Log in" })));
  await settle();

  expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
    "POST /auth/login",
    "GET /me/favorites",
    "PUT /me/favorites/harbour-coffee",
  ]);
  expect(screen.getByRole("button", { name: "Saved to favorites" })).toBeSelected();
});

test("a signed-in visitor removes a saved place with the heart", async () => {
  signedInBefore();
  api(({ url, method }) => {
    if (url === "/auth/refresh") return { status: 200, body: tokens };
    if (method === "GET") return { status: 200, body: { items: [coffee] } };
    return { status: 204 };
  });
  renderScreen(<FavoriteButton slug="harbour-coffee" onNeedLogin={jest.fn()} />);
  await settle();
  await settle();

  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Saved to favorites" })));

  expect(calls.at(-1)).toMatchObject({ method: "DELETE", url: "/me/favorites/harbour-coffee" });
  expect(screen.getByRole("button", { name: "Save to favorites" })).not.toBeSelected();
});

test("Favorites lists the saved places, removes one, and then points to Explore", async () => {
  signedInBefore();
  api(({ url, method }) => {
    if (url === "/auth/refresh") return { status: 200, body: tokens };
    if (method === "GET") return { status: 200, body: { items: [coffee] } };
    return { status: 204 };
  });
  const handlers = { onOpen: jest.fn(), onLogin: jest.fn(), onExplore: jest.fn() };
  renderScreen(<FavoritesScreen {...handlers} />);
  await settle();
  await settle();

  fireEvent.press(screen.getByRole("link", { name: /Harbour Coffee/ }));
  expect(handlers.onOpen).toHaveBeenCalledWith(coffee);

  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Remove Harbour Coffee from favorites" })));
  fireEvent.press(screen.getByRole("button", { name: "Go to Explore" }));
  expect(handlers.onExplore).toHaveBeenCalledTimes(1);
});

test("Favorites asks a visitor to log in", async () => {
  api(() => ({ status: 500 }));
  const onLogin = jest.fn();
  renderScreen(<FavoritesScreen onOpen={jest.fn()} onLogin={onLogin} onExplore={jest.fn()} />);
  await settle();

  fireEvent.press(screen.getByRole("button", { name: "Log in" }));
  expect(onLogin).toHaveBeenCalledTimes(1);
  expect(calls).toHaveLength(0);
});
