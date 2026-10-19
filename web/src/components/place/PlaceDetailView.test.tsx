import type { PlaceDetail } from "@queenstown/shared";
import { screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { PlaceDetailView } from "./PlaceDetailView";

// The back link reads the router; nothing here navigates.
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));
// The heart has its own tests (components/account).
vi.mock("@/components/account/FavoriteButton", () => ({ FavoriteButton: () => null }));

const full: PlaceDetail = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  address: "12 Beach Street, Queenstown",
  imageUrl: null,
  latitude: -45.0322,
  longitude: 168.661,
  description: "Lakefront restaurant.",
  openingHours: "Mon - Sun · 8:00 am - 10:00 pm",
  phone: "03 000 0000",
  website: "https://lakesidekitchen.example",
  source: "Business website",
  sourceUrl: "https://lakesidekitchen.example/about",
  updatedAt: "2026-10-02T01:30:00Z",
};

const bare: PlaceDetail = { ...full, description: null, openingHours: null, phone: null, website: null };

test("shows every part of a complete place", () => {
  renderWithMessages(<PlaceDetailView place={full} />);

  expect(screen.getByRole("heading", { level: 1, name: "Lakeside Kitchen" })).toBeInTheDocument();

  const breadcrumb = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
  expect(breadcrumb.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/explore");
  expect(breadcrumb.getByRole("link", { name: "Food" })).toHaveAttribute("href", "/explore/food");

  expect(screen.getByText("Lakefront restaurant.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Address" })).toBeInTheDocument();
  expect(screen.getByText("12 Beach Street, Queenstown")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Opening hours" })).toBeInTheDocument();
  expect(screen.getByText("Mon - Sun · 8:00 am - 10:00 pm")).toBeInTheDocument();

  expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "03 000 0000" })).toHaveAttribute("href", "tel:030000000");
  expect(screen.getByRole("link", { name: "lakesidekitchen.example" })).toHaveAttribute(
    "href",
    "https://lakesidekitchen.example",
  );

  expect(screen.getByRole("link", { name: "Business website" })).toHaveAttribute(
    "href",
    "https://lakesidekitchen.example/about",
  );
  expect(document.body.textContent).toContain("Source: Business website");
  expect(screen.getByText("Updated 2 Oct 2026")).toBeInTheDocument();
});

test("offers Suggest an edit when the site has a contact address", () => {
  renderWithMessages(<PlaceDetailView place={full} suggestEditHref="mailto:hello@queenstownlocal.example?subject=x" />);

  expect(screen.getByRole("link", { name: "Suggest an edit" })).toHaveAttribute(
    "href",
    "mailto:hello@queenstownlocal.example?subject=x",
  );
});

test("has no Suggest an edit without a contact address", () => {
  renderWithMessages(<PlaceDetailView place={full} suggestEditHref={null} />);

  expect(screen.queryByRole("link", { name: "Suggest an edit" })).not.toBeInTheDocument();
});

test("offers a way back to Explore", () => {
  renderWithMessages(<PlaceDetailView place={full} />);

  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/explore");
});

test("uses the category label, not the code", () => {
  renderWithMessages(<PlaceDetailView place={{ ...full, category: "facility", subtype: "toilet" }} />);

  const breadcrumb = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
  expect(breadcrumb.getByRole("link", { name: "Facilities" })).toHaveAttribute("href", "/explore/facility");
});

test("hides the rows a place does not have", () => {
  renderWithMessages(<PlaceDetailView place={bare} />);

  expect(screen.queryByRole("heading", { name: "Opening hours" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Contact" })).toBeNull();
  expect(document.body.textContent).not.toContain("null");

  expect(screen.getByRole("heading", { name: "Address" })).toBeInTheDocument();
  expect(document.body.textContent).toContain("Source: Business website");
  expect(screen.getByText("Updated 2 Oct 2026")).toBeInTheDocument();
});

test("shows the contact heading when only one contact exists", () => {
  renderWithMessages(<PlaceDetailView place={{ ...bare, phone: "03 000 0000" }} />);

  expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "03 000 0000" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "lakesidekitchen.example" })).toBeNull();
});

test("opens external links safely", () => {
  renderWithMessages(<PlaceDetailView place={full} />);

  for (const name of ["lakesidekitchen.example", "Business website"]) {
    expect(screen.getByRole("link", { name }).getAttribute("rel")).toContain("noopener");
  }
});

test("does not turn a non-web address into a link", () => {
  renderWithMessages(
    <PlaceDetailView place={{ ...full, website: "javascript:alert(1)", sourceUrl: "javascript:alert(2)" }} />,
  );

  for (const link of screen.getAllByRole("link")) {
    expect(link.getAttribute("href")).not.toContain("javascript:");
  }
  // The source name is still shown, just not as a link.
  expect(document.body.textContent).toContain("Source: Business website");
});

test("shows the category under the name", () => {
  const { rerender } = renderWithMessages(<PlaceDetailView place={full} />);
  expect(screen.getByText("Food", { selector: "p" })).toBeInTheDocument();

  rerender(<PlaceDetailView place={{ ...full, category: "facility", subtype: "toilet" }} />);
  expect(screen.getByText("Facilities · Public toilet", { selector: "p" })).toBeInTheDocument();

  rerender(<PlaceDetailView place={{ ...full, category: "facility", subtype: "other" }} />);
  expect(screen.getByText("Facilities", { selector: "p" })).toBeInTheDocument();
});

test("links to the map", () => {
  renderWithMessages(<PlaceDetailView place={full} />);

  expect(screen.getByRole("link", { name: "View on map" })).toHaveAttribute("href", "/?place=lakeside-kitchen");
});

test("offers the quick actions", () => {
  renderWithMessages(<PlaceDetailView place={full} />);

  const actions = within(screen.getByRole("group", { name: "Quick actions" }));
  expect(actions.getByRole("link", { name: "Call" })).toBeInTheDocument();
  expect(actions.getByRole("button", { name: "Share" })).toBeInTheDocument();
});

test("shows the image only when it can", () => {
  const { rerender } = renderWithMessages(
    <PlaceDetailView place={{ ...full, imageUrl: "https://lakesidekitchen.example/front.jpg" }} />,
  );
  expect(screen.getByRole("img", { name: "Lakeside Kitchen" })).toHaveAttribute(
    "src",
    "https://lakesidekitchen.example/front.jpg",
  );

  for (const imageUrl of [null, "javascript:alert(1)"]) {
    rerender(<PlaceDetailView place={{ ...full, imageUrl }} />);
    expect(screen.queryByRole("img")).toBeNull();
  }
});

test("shows a phone it cannot dial as text", () => {
  renderWithMessages(<PlaceDetailView place={{ ...full, phone: "call us" }} />);

  expect(screen.getByText("call us")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "call us" })).toBeNull();
});
