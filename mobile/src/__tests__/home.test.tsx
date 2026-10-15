import { render, screen } from "@testing-library/react-native";
import Home from "../app/index";

test("shows the app name and the service centre from the shared package", async () => {
  await render(<Home />);

  expect(screen.getByText("Queenstown Local")).toBeTruthy();
  expect(screen.getByText("-45.0312, 168.6626")).toBeTruthy();
});
