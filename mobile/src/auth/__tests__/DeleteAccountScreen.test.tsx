import { act, fireEvent, screen } from "@testing-library/react-native";
import * as SecureStore from "expo-secure-store";
import { renderScreen } from "@/test/render";
import { DeleteAccountScreen } from "../DeleteAccountScreen";
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

const onDone = jest.fn();
const onLogin = jest.fn();

async function open() {
  renderScreen(<DeleteAccountScreen onDone={onDone} onLogin={onLogin} />);
  await act(async () => {});
}

beforeEach(() => {
  resetForTests();
  items.clear();
  calls = [];
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  onDone.mockReset();
  onLogin.mockReset();
});

test("says what goes, takes the password again, deletes the account and confirms", async () => {
  items.set("auth.refreshToken", "r0");
  api(({ url }) => (url === "/auth/refresh" ? { status: 200, body: tokens } : { status: 204 }));
  await open();

  expect(screen.getByText(/kiri@example\.com/)).toBeOnTheScreen();
  expect(screen.getByText(/your saved places/)).toBeOnTheScreen();
  fireEvent.changeText(screen.getByLabelText("Password"), "correct horse battery");
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Delete my account" })));

  expect(calls.at(-1)).toEqual({ method: "DELETE", url: "/me", body: { password: "correct horse battery" } });
  expect(screen.getByText("Your account has been deleted.")).toBeOnTheScreen();
  expect(items.has("auth.refreshToken")).toBe(false);
  fireEvent.press(screen.getByRole("button", { name: "Done" }));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test("a wrong password says so and keeps the account", async () => {
  items.set("auth.refreshToken", "r0");
  api(({ url }) =>
    url === "/auth/refresh"
      ? { status: 200, body: tokens }
      : { status: 403, body: { code: "WRONG_PASSWORD", status: 403, detail: "That password is wrong." } },
  );
  await open();

  fireEvent.changeText(screen.getByLabelText("Password"), "not mine");
  await act(async () => fireEvent.press(screen.getByRole("button", { name: "Delete my account" })));

  expect(screen.getByText("That password is wrong.")).toBeOnTheScreen();
  expect(items.get("auth.refreshToken")).toBe("r");
});

test("a visitor who is not signed in is asked to log in", async () => {
  await open();

  expect(screen.getByText("Log in to delete your account.")).toBeOnTheScreen();
  fireEvent.press(screen.getByRole("button", { name: "Log in" }));
  expect(onLogin).toHaveBeenCalledTimes(1);
});
