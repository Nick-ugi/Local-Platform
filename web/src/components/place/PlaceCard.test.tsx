import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { placeSummary } from "@/test/places";
import { renderWithMessages } from "@/test/render";
import { PlaceCard } from "./PlaceCard";

test("links to the detail page", () => {
  renderWithMessages(<PlaceCard place={placeSummary()} />);

  const link = screen.getByRole("link");
  expect(link).toHaveAttribute("href", "/places/lakeside-kitchen");
  expect(link).toHaveTextContent("Lakeside Kitchen");
  expect(link).toHaveTextContent("12 Beach Street");
});

test("encodes the slug as one path segment", () => {
  renderWithMessages(<PlaceCard place={placeSummary({ slug: "a/b c" })} />);

  expect(screen.getByRole("link")).toHaveAttribute("href", "/places/a%2Fb%20c");
});

test.each([
  [350, "Food · 350 m"],
  [1240, "Food · 1.2 km"],
])("shows a distance of %i m", (distanceM, line) => {
  renderWithMessages(<PlaceCard place={placeSummary({ distanceM })} />);

  expect(screen.getByText("Food").parentElement).toHaveTextContent(line);
});

test("leaves the distance out when there is none", () => {
  renderWithMessages(<PlaceCard place={placeSummary({ distanceM: null })} />);

  expect(screen.getByText("Food").parentElement).toHaveTextContent(/^Food$/);
});

test("shows the image when the place has one", () => {
  const { container } = renderWithMessages(
    <PlaceCard place={placeSummary({ imageUrl: "https://img.example/lakeside.jpg" })} />,
  );

  // Decorative beside the name: an empty alt keeps it out of the link's name.
  const image = container.querySelector("img");
  expect(image).toHaveAttribute("src", "https://img.example/lakeside.jpg");
  expect(image).toHaveAttribute("alt", "");
  expect(image).toHaveAttribute("loading", "lazy");
});

test("keeps the image's place when there is no image", () => {
  const { container } = renderWithMessages(<PlaceCard place={placeSummary({ imageUrl: null })} />);

  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector('[data-slot="image-placeholder"]')).not.toBeNull();
});
