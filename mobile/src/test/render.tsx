import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { VisitorPositionProvider } from "@/geo/VisitorPosition";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";

/** Renders a screen inside the providers the app's root layout gives every screen. */
export function renderScreen(element: ReactElement) {
  return render(
    <AppIntlProvider>
      <VisitorPositionProvider>{element}</VisitorPositionProvider>
    </AppIntlProvider>,
  );
}
