import type { EventSummary, NoticeSummary, Page } from "@queenstown/shared";
import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import { EventsScreen, NoticesScreen } from "./LocalLists";

function page<T>(items: T[], total = items.length, at = 1): Page<T> {
  return { items, page: at, size: 20, total };
}

const works: NoticeSummary = {
  slug: "shotover-street-road-works",
  title: "Shotover Street road works",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-06T07:00:00+13:00",
  endsAt: "2026-10-20T18:00:00+13:00",
};

const market: EventSummary = {
  slug: "lakefront-night-market",
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T17:00:00+13:00",
  endsAt: "2026-10-09T21:00:00+13:00",
  venueName: "Earnslaw Park",
  imageUrl: null,
  latitude: -45.0331,
  longitude: 168.6597,
};

test("the notices list shows type, Official, title and period, and links to the notice", () => {
  renderWithMessages(<NoticesScreen type={null} result={page([works, { ...works, slug: "b", isOfficial: false }])} />);

  const [first, second] = screen.getAllByRole("listitem");
  expect(within(first).getByRole("link")).toHaveAttribute("href", "/notices/shotover-street-road-works");
  expect(first).toHaveTextContent("Road Work");
  expect(first).toHaveTextContent("Official");
  expect(within(first).getByRole("heading", { name: "Shotover Street road works" })).toBeInTheDocument();
  expect(first).toHaveTextContent("6 Oct - 20 Oct 2026");
  expect(second).not.toHaveTextContent("Official");
});

test("a notice without an end runs from its start", () => {
  renderWithMessages(<NoticesScreen type={null} result={page([{ ...works, endsAt: null }])} />);

  expect(screen.getByText("From 6 Oct 2026")).toBeInTheDocument();
});

test("the tabs lead to both lists and mark the one shown", () => {
  renderWithMessages(<NoticesScreen type={null} result={page([works])} />);

  const tabs = within(screen.getByRole("navigation", { name: "Local" }));
  expect(tabs.getByRole("link", { name: "Notices" })).toHaveAttribute("aria-current", "page");
  expect(tabs.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");
});

test("the type filters link to their lists and mark the chosen one", () => {
  renderWithMessages(<NoticesScreen type="road-closure" result={page([])} />);

  const filters = within(screen.getByRole("navigation", { name: "Notice types" }));
  expect(filters.getByRole("link", { name: "All types" })).toHaveAttribute("href", "/notices");
  expect(filters.getByRole("link", { name: "Road Closure" })).toHaveAttribute("aria-current", "page");
  expect(filters.getByRole("link", { name: "Emergency" })).toHaveAttribute("href", "/notices?type=emergency");
});

test("an empty list says so and offers to drop the filter", () => {
  const { rerender } = renderWithMessages(<NoticesScreen type={null} result={page([])} />);
  expect(screen.getByText("There are no current notices.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Show all types" })).toBeNull();

  rerender(<NoticesScreen type="emergency" result={page([])} />);
  expect(screen.getByText("There are no current notices of this type.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Show all types" })).toHaveAttribute("href", "/notices");
});

test("the pages keep the type", () => {
  renderWithMessages(<NoticesScreen type="road-work" result={page([works], 45)} />);

  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/notices?type=road-work&page=2");
});

test("the events list shows title, when and where, and links to the event", () => {
  renderWithMessages(<EventsScreen when={null} result={page([market])} />);

  const item = screen.getByRole("listitem");
  expect(within(item).getByRole("link")).toHaveAttribute("href", "/events/lakefront-night-market");
  expect(item).toHaveTextContent("Lakefront Night Market");
  expect(item).toHaveTextContent("Fri 9 Oct · 5:00 pm - 9:00 pm");
  expect(item).toHaveTextContent("Earnslaw Park");
});

test("the date filters link to their lists and an empty period offers all events", () => {
  renderWithMessages(<EventsScreen when="week" result={page([])} />);

  const filters = within(screen.getByRole("navigation", { name: "Dates" }));
  expect(filters.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "All",
    "Today",
    "This Week",
    "This Month",
  ]);
  expect(filters.getByRole("link", { name: "This Week" })).toHaveAttribute("aria-current", "page");
  expect(filters.getByRole("link", { name: "Today" })).toHaveAttribute("href", "/events?when=today");
  expect(screen.getByText("There are no events in this period.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Show all events" })).toHaveAttribute("href", "/events");
});

test("an event without a picture shows the event colour and a party popper instead", () => {
  const { container } = renderWithMessages(<EventsScreen when={null} result={page([market])} />);

  const placeholder = container.querySelector('[data-slot="image-placeholder"]') as HTMLElement;
  expect(placeholder).toHaveTextContent("🎉");
  expect(placeholder).toHaveAttribute("aria-hidden", "true");
});
