import type { EventDetail, NoticeDetail, PlaceDetail } from "@queenstown/shared";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Linking, Platform, Share } from "react-native";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { EventDetailView } from "../EventDetailView";
import { NoticeDetailView } from "../NoticeDetailView";
import { PlaceDetailView } from "../PlaceDetailView";

const openURL = jest.spyOn(Linking, "openURL");
const share = jest.spyOn(Share, "share");

const coffee: PlaceDetail = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: null,
  latitude: -45.0335,
  longitude: 168.659,
  description: "Flat whites by the lake.",
  openingHours: "Mon-Sun 7:00 am - 4:00 pm",
  phone: "+64 3 441 0000",
  website: "https://harbourcoffee.example/",
  source: "Harbour Coffee website",
  sourceUrl: "https://harbourcoffee.example/about",
  updatedAt: "2026-10-01T12:30:00Z",
};

const market: EventDetail = {
  slug: "lakefront-night-market",
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T04:00:00Z",
  endsAt: "2026-10-09T08:00:00Z",
  venueName: "Earnslaw Park",
  imageUrl: null,
  latitude: -45.0318,
  longitude: 168.6602,
  description: "Food stalls and music.",
  address: "Marine Parade",
  source: "Queenstown Events",
  sourceUrl: "https://events.example/night-market",
  updatedAt: "2026-10-02T01:30:00Z",
  ended: false,
};

const works: NoticeDetail = {
  slug: "shotover-street-works",
  title: "Shotover Street resurfacing",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-05T18:00:00Z",
  endsAt: "2026-10-20T05:00:00Z",
  summary: "One lane closed at night.",
  locationName: "Shotover Street",
  latitude: -45.0305,
  longitude: 168.6615,
  sourceOrg: "Queenstown Lakes District Council",
  sourceUrl: "https://qldc.example/works",
  updatedAt: "2026-10-03T01:30:00Z",
  ended: false,
};

function show(element: React.ReactElement) {
  return render(<AppIntlProvider>{element}</AppIntlProvider>);
}

beforeEach(() => {
  openURL.mockReset();
  openURL.mockResolvedValue(true);
  share.mockReset();
  share.mockResolvedValue({ action: Share.sharedAction });
  delete process.env.EXPO_PUBLIC_SITE_URL;
  // The app is checked on Android (docs/plans/2026-10-15-week10-app-core.md).
  Platform.OS = "android";
});

describe("Place", () => {
  test("shows every part of the place", () => {
    show(<PlaceDetailView place={coffee} onViewOnMap={jest.fn()} />);

    expect(screen.getByRole("header", { name: "Harbour Coffee" })).toBeOnTheScreen();
    expect(screen.getByText("Cafes")).toBeOnTheScreen();
    expect(screen.getByText("Flat whites by the lake.")).toBeOnTheScreen();
    expect(screen.getByText("5 Marine Parade")).toBeOnTheScreen();
    expect(screen.getByText("Mon-Sun 7:00 am - 4:00 pm")).toBeOnTheScreen();
    expect(screen.getByText("harbourcoffee.example")).toBeOnTheScreen();
    expect(screen.getByText("Source: Harbour Coffee website")).toBeOnTheScreen();
    expect(screen.getByText("Updated 2 Oct 2026")).toBeOnTheScreen();
  });

  test("the quick actions call, open the website, give directions and share the web address", async () => {
    show(<PlaceDetailView place={coffee} onViewOnMap={jest.fn()} />);

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Call" })));
    expect(openURL).toHaveBeenLastCalledWith("tel:+6434410000");

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Website" })));
    expect(openURL).toHaveBeenLastCalledWith("https://harbourcoffee.example/");

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Directions" })));
    expect(openURL).toHaveBeenLastCalledWith(expect.stringMatching(/^geo:-45.0335,168.659/));

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Share" })));
    expect(share).toHaveBeenCalledWith({
      title: "Harbour Coffee",
      message: "Harbour Coffee\nhttp://localhost:3001/places/harbour-coffee",
    });
  });

  test("a place without a phone or website has only Directions and Share, and no Contact", () => {
    show(<PlaceDetailView place={{ ...coffee, phone: null, website: null, openingHours: null, description: null }} onViewOnMap={jest.fn()} />);

    expect(screen.queryByRole("button", { name: "Call" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Website" })).toBeNull();
    expect(screen.getByRole("button", { name: "Directions" })).toBeOnTheScreen();
    expect(screen.queryByText("Contact")).toBeNull();
    expect(screen.queryByText("Opening hours")).toBeNull();
  });

  test("a facility shows its kind", () => {
    show(<PlaceDetailView place={{ ...coffee, category: "facility", subtype: "toilet" }} onViewOnMap={jest.fn()} />);

    expect(screen.getByText("Facilities · Public toilet")).toBeOnTheScreen();
  });

  test("an action the phone cannot do says so", async () => {
    openURL.mockRejectedValue(new Error("No app"));
    show(<PlaceDetailView place={coffee} onViewOnMap={jest.fn()} />);

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Website" })));

    expect(screen.getByText("Couldn't open this on your phone.")).toBeOnTheScreen();
  });

  test("View on map", () => {
    const onViewOnMap = jest.fn();
    show(<PlaceDetailView place={coffee} onViewOnMap={onViewOnMap} />);

    fireEvent.press(screen.getByRole("link", { name: "View on map" }));

    expect(onViewOnMap).toHaveBeenCalledTimes(1);
  });
});

describe("Event", () => {
  test("shows when and where in New Zealand time, with the year", () => {
    show(<EventDetailView event={market} onViewOnMap={jest.fn()} />);

    expect(screen.getByRole("header", { name: "Lakefront Night Market" })).toBeOnTheScreen();
    expect(screen.getByText("Fri 9 Oct 2026 · 5:00 pm - 9:00 pm")).toBeOnTheScreen();
    expect(screen.getByText("Earnslaw Park")).toBeOnTheScreen();
    expect(screen.getByText("Marine Parade")).toBeOnTheScreen();
    expect(screen.getByText("Queenstown Events")).toBeOnTheScreen();
    expect(screen.queryByText("This event has ended.")).toBeNull();
  });

  test("opens the official page, shares, and leads to the map", async () => {
    const onViewOnMap = jest.fn();
    show(<EventDetailView event={market} onViewOnMap={onViewOnMap} />);

    await act(async () => fireEvent.press(screen.getByRole("link", { name: "Official event page" })));
    expect(openURL).toHaveBeenCalledWith("https://events.example/night-market");

    await act(async () => fireEvent.press(screen.getByRole("button", { name: "Share" })));
    expect(share.mock.calls[0][0]).toMatchObject({ message: expect.stringContaining("/events/lakefront-night-market") });

    fireEvent.press(screen.getByRole("link", { name: "View on map" }));
    expect(onViewOnMap).toHaveBeenCalledTimes(1);
  });

  test("an ended event says so and is not on the map", () => {
    show(<EventDetailView event={{ ...market, ended: true }} onViewOnMap={jest.fn()} />);

    expect(screen.getByText("This event has ended.")).toBeOnTheScreen();
    expect(screen.queryByRole("link", { name: "View on map" })).toBeNull();
  });
});

describe("Notice", () => {
  test("shows its type, Official, period, summary, location and source", () => {
    show(<NoticeDetailView notice={works} onViewOnMap={jest.fn()} />);

    expect(screen.getByText("Road Work")).toBeOnTheScreen();
    expect(screen.getByText("Official")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Shotover Street resurfacing" })).toBeOnTheScreen();
    expect(screen.getByText("6 Oct - 20 Oct 2026")).toBeOnTheScreen();
    expect(screen.getByText("One lane closed at night.")).toBeOnTheScreen();
    expect(screen.getByText("Shotover Street")).toBeOnTheScreen();
    expect(screen.getByText("Queenstown Lakes District Council")).toBeOnTheScreen();
    expect(screen.getByText("Updated 3 Oct 2026")).toBeOnTheScreen();
  });

  test("opens the original", async () => {
    show(<NoticeDetailView notice={works} onViewOnMap={jest.fn()} />);

    await act(async () => fireEvent.press(screen.getByRole("link", { name: "Open original" })));

    expect(openURL).toHaveBeenCalledWith("https://qldc.example/works");
  });

  test("a notice without a location has no Location row", () => {
    show(<NoticeDetailView notice={{ ...works, latitude: null, longitude: null, locationName: null }} onViewOnMap={jest.fn()} />);

    expect(screen.queryByText("Location")).toBeNull();
    expect(screen.queryByRole("link", { name: "View on map" })).toBeNull();
  });

  test("a notice without an end runs from its start; an ended one says so", () => {
    show(<NoticeDetailView notice={{ ...works, endsAt: null, ended: true }} onViewOnMap={jest.fn()} />);

    expect(screen.getByText("From 6 Oct 2026")).toBeOnTheScreen();
    expect(screen.getByText("This notice has ended.")).toBeOnTheScreen();
    expect(screen.queryByRole("link", { name: "View on map" })).toBeNull();
  });
});
