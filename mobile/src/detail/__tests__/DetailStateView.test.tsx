import { act, render, screen } from "@testing-library/react-native";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { DetailStateView } from "../DetailStateView";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const actions = { retry: jest.fn(), onGoToMap: jest.fn(), onGoToExplore: jest.fn() };

test("loading says Loading, then after five seconds that the server is waking up", () => {
  render(<DetailStateView status="loading" {...actions} />, { wrapper: AppIntlProvider });
  expect(screen.getByText("Loading…")).toBeOnTheScreen();

  act(() => jest.advanceTimersByTime(5000));

  expect(screen.getByText("Waking up the server… This can take up to a minute.")).toBeOnTheScreen();
  expect(screen.queryByText("Loading…")).toBeNull();
});
