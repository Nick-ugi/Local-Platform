import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PlaceImage } from "./PlaceImage";

const fallback = <span>no image</span>;

test("shows the image", () => {
  render(<PlaceImage src="https://img.example/a.jpg" alt="Lakeside Kitchen" fallback={fallback} />);

  expect(screen.getByRole("img", { name: "Lakeside Kitchen" })).toHaveAttribute("src", "https://img.example/a.jpg");
  expect(screen.queryByText("no image")).toBeNull();
});

test.each([[null], ["javascript:alert(1)"], ["data:image/png;base64,AAAA"], ["/relative.jpg"], [""]])(
  "shows nothing but the fallback for the address %s",
  (src) => {
    const { container } = render(<PlaceImage src={src} alt="Lakeside Kitchen" fallback={fallback} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("no image")).toBeInTheDocument();
  },
);

test("gives way to the fallback when the image fails", () => {
  const { container } = render(<PlaceImage src="https://img.example/gone.jpg" alt="" fallback={fallback} />);

  fireEvent.error(container.querySelector("img") as HTMLImageElement);

  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText("no image")).toBeInTheDocument();
});

test("leaves no trace without a fallback", () => {
  const { container } = render(<PlaceImage src={null} alt="" />);

  expect(container).toBeEmptyDOMElement();
});

test("tries again when it is given another address", () => {
  const { container, rerender } = render(<PlaceImage src="https://img.example/gone.jpg" alt="" />);
  fireEvent.error(container.querySelector("img") as HTMLImageElement);

  rerender(<PlaceImage src="https://img.example/other.jpg" alt="" />);

  expect(container.querySelector("img")).toHaveAttribute("src", "https://img.example/other.jpg");
});
