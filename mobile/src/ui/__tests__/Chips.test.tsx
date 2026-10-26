import { render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { Chips } from "../Chips";

test("the row is only as tall as its chips, however much room the screen has", () => {
  render(<Chips label="Categories" items={[{ key: "all", label: "All", selected: true }]} onPress={jest.fn()} />);

  expect(StyleSheet.flatten(screen.getByLabelText("Categories").props.style)).toMatchObject({ flexGrow: 0 });
});

test("a chip with a colour shows a dot of it before its name, hidden from screen readers", () => {
  render(
    <Chips
      label="Categories"
      items={[
        { key: "all", label: "All", selected: true },
        { key: "cafe", label: "Cafes", selected: false, color: "#92400e" },
      ]}
      onPress={jest.fn()}
    />,
  );

  const cafes = screen.getByRole("button", { name: "Cafes" });
  const dot = within(cafes).getByTestId("kind-dot", { includeHiddenElements: true });
  expect(StyleSheet.flatten(dot.props.style)).toMatchObject({ backgroundColor: "#92400e" });
  expect(dot).not.toBeVisible();

  const all = screen.getByRole("button", { name: "All" });
  expect(within(all).queryByTestId("kind-dot", { includeHiddenElements: true })).toBeNull();
});
