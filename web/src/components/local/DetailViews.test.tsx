import type { EventDetail, NoticeDetail } from "@queenstown/shared";
import { screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { EventDetailView } from "./EventDetailView";
import { NoticeDetailView } from "./NoticeDetailView";

// The back link reads the router; nothing here navigates.
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const notice: NoticeDetail = {
  slug: "shotover-street-road-works",
  title: "Shotover Street road works",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-06T07:00:00+13:00",
  endsAt: "2026-10-20T18:00:00+13:00",
  summary: "Road works on Shotover Street. Expect delays.",
  locationName: "Shotover Street, between Camp St and Stanley St",
  latitude: -45.0312,
  longitude: 168.6626,
  sourceOrg: "Queenstown Lakes District Council",
  sourceUrl: "https://council.example/notices/shotover-street",
  updatedAt: "2026-10-04T20:15:00Z",
  ended: false,
};

const event: EventDetail = {
  slug: "lakefront-night-market",
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T17:00:00+13:00",
  endsAt: "2026-10-09T21:00:00+13:00",
  venueName: "Earnslaw Park",
  imageUrl: "https://nightmarket.example/stalls.jpg",
  latitude: -45.0331,
  longitude: 168.6597,
  description: "Food stalls and live music on the lakefront.",
  address: "Earnslaw Park, Queenstown",
  source: "Night Market Trust",
  sourceUrl: "https://nightmarket.example",
  updatedAt: "2026-10-01T22:00:00Z",
  ended: false,
};

test("a notice shows its type, Official, period, summary, location, source and date", () => {
  renderWithMessages(<NoticeDetailView notice={notice} />);

  expect(screen.getByRole("heading", { level: 1, name: "Shotover Street road works" })).toBeInTheDocument();
  expect(screen.getByText("Road Work")).toBeInTheDocument();
  expect(screen.getByText("Official")).toBeInTheDocument();
  expect(screen.getByText("6 Oct - 20 Oct 2026")).toBeInTheDocument();
  expect(screen.getByText("Road works on Shotover Street. Expect delays.")).toBeInTheDocument();
  expect(screen.getByText("Shotover Street, between Camp St and Stanley St")).toBeInTheDocument();
  expect(screen.getByText("Queenstown Lakes District Council")).toBeInTheDocument();
  expect(screen.getByText("Updated 5 Oct 2026")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
});

test("a notice links to the map and to its original", () => {
  renderWithMessages(<NoticeDetailView notice={notice} />);

  expect(screen.getByRole("link", { name: "View on map" })).toHaveAttribute(
    "href",
    "/?notice=shotover-street-road-works",
  );
  const original = screen.getByRole("link", { name: /Open original/ });
  expect(original).toHaveAttribute("href", "https://council.example/notices/shotover-street");
  expect(original).toHaveAttribute("rel", "noopener noreferrer");
});

test("a notice without a location has no Location and no way to the map", () => {
  renderWithMessages(
    <NoticeDetailView notice={{ ...notice, latitude: null, longitude: null, locationName: null }} />,
  );

  expect(screen.queryByRole("heading", { name: "Location" })).toBeNull();
  expect(screen.queryByRole("link", { name: "View on map" })).toBeNull();
});

test("a notice from an unofficial source has no Official mark, and an unsafe original no link", () => {
  renderWithMessages(<NoticeDetailView notice={{ ...notice, isOfficial: false, sourceUrl: "javascript:alert(1)" }} />);

  expect(screen.queryByText("Official")).toBeNull();
  expect(screen.queryByRole("link", { name: /Open original/ })).toBeNull();
  expect(screen.getByText("Queenstown Lakes District Council")).toBeInTheDocument();
});

test("an ended notice says so", () => {
  renderWithMessages(<NoticeDetailView notice={{ ...notice, ended: true }} />);

  expect(screen.getByText("This notice has ended.")).toBeInTheDocument();
});

test("an event shows its picture, when, where, description and source", () => {
  renderWithMessages(<EventDetailView event={event} />);

  expect(screen.getByRole("img", { name: "Lakefront Night Market" })).toHaveAttribute(
    "src",
    "https://nightmarket.example/stalls.jpg",
  );
  expect(screen.getByText("Fri 9 Oct 2026 · 5:00 pm - 9:00 pm")).toBeInTheDocument();
  expect(screen.getByText("Earnslaw Park")).toBeInTheDocument();
  expect(screen.getByText("Earnslaw Park, Queenstown")).toBeInTheDocument();
  expect(screen.getByText("Food stalls and live music on the lakefront.")).toBeInTheDocument();
  expect(screen.getByText("Night Market Trust")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Official event page/ })).toHaveAttribute("href", "https://nightmarket.example");
  expect(screen.queryByText("This event has ended.")).toBeNull();
});

test("an event links to the map and back to the events", () => {
  renderWithMessages(<EventDetailView event={event} />);

  expect(screen.getByRole("link", { name: "View on map" })).toHaveAttribute("href", "/?event=lakefront-night-market");
  const breadcrumb = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
  expect(breadcrumb.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/events");
});

test("an event without a picture, description or address leaves them out, and an ended one says so", () => {
  renderWithMessages(
    <EventDetailView event={{ ...event, imageUrl: null, description: null, address: null, ended: true }} />,
  );

  expect(screen.queryByRole("img")).toBeNull();
  expect(document.body.textContent).not.toContain("null");
  expect(screen.getByText("This event has ended.")).toBeInTheDocument();
});
