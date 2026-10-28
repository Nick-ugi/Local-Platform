import type { PlaceMarker } from "@queenstown/shared";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { MarkerPreview } from "./MarkerPreview";

const marker: PlaceMarker = {
  kind: "place",
  slug: "lakeside-kitchen",
  latitude: -45.0322,
  longitude: 168.661,
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  openingHours: null,
};

test("shows the name, category label and distance", () => {
  renderWithMessages(<MarkerPreview marker={marker} distanceText="350 m" onClose={() => {}} />);

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(screen.getByText("Food")).toBeInTheDocument();
  expect(screen.getByText("350 m")).toBeInTheDocument();
});

test("a place with readable hours says whether it is open now, in New Zealand time", async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date("2026-10-20T10:00:00+13:00"));
    renderWithMessages(
      <MarkerPreview marker={{ ...marker, openingHours: "Mo-Su 09:00-17:00" }} distanceText={null} onClose={() => {}} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText("Open now · until 5:00 pm")).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("a place without hours has no badge", () => {
  renderWithMessages(<MarkerPreview marker={marker} distanceText={null} onClose={() => {}} />);

  expect(screen.queryByText(/Open now|Closed|Closes soon|Open 24 hours/)).not.toBeInTheDocument();
});

test("links to the place", () => {
  renderWithMessages(<MarkerPreview marker={marker} distanceText={null} onClose={() => {}} />);

  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/places/lakeside-kitchen");
});

test("leaves the distance out when it is unknown", () => {
  renderWithMessages(<MarkerPreview marker={marker} distanceText={null} onClose={() => {}} />);

  // The line under the name holds the category and nothing after it.
  expect(screen.getByText("Food").parentElement).toHaveTextContent(/^Food$/);
});

test("Close reports back", async () => {
  const onClose = vi.fn();
  renderWithMessages(<MarkerPreview marker={marker} distanceText="350 m" onClose={onClose} />);

  await userEvent.click(screen.getByRole("button", { name: "Close" }));

  expect(onClose).toHaveBeenCalledTimes(1);
});

test("an event shows its title, time and venue, and links to the event", () => {
  renderWithMessages(
    <MarkerPreview
      marker={{
        kind: "event",
        slug: "lakefront-night-market",
        latitude: -45.0331,
        longitude: 168.6597,
        title: "Lakefront Night Market",
        startsAt: "2026-10-09T17:00:00+13:00",
        endsAt: "2026-10-09T21:00:00+13:00",
        venueName: "Earnslaw Park",
      }}
      distanceText="200 m"
      onClose={() => {}}
    />,
  );

  expect(screen.getByRole("heading", { name: "Lakefront Night Market" })).toBeInTheDocument();
  expect(screen.getByText("Fri 9 Oct · 5:00 pm - 9:00 pm")).toBeInTheDocument();
  expect(screen.getByText("Earnslaw Park").parentElement).toHaveTextContent("Earnslaw Park · 200 m");
  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/events/lakefront-night-market");
});

test("a notice shows its type, Official mark, title and period, and links to the notice", () => {
  renderWithMessages(
    <MarkerPreview
      marker={{
        kind: "notice",
        slug: "shotover-street-road-works",
        latitude: -45.0312,
        longitude: 168.6626,
        title: "Shotover Street road works",
        type: "road-work",
        isOfficial: true,
        startsAt: "2026-10-06T07:00:00+13:00",
        endsAt: "2026-10-20T18:00:00+13:00",
      }}
      distanceText={null}
      onClose={() => {}}
    />,
  );

  expect(screen.getByText("Road Work")).toBeInTheDocument();
  expect(screen.getByText("Official")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Shotover Street road works" })).toBeInTheDocument();
  expect(screen.getByText("6 Oct - 20 Oct 2026")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
    "href",
    "/notices/shotover-street-road-works",
  );
});
