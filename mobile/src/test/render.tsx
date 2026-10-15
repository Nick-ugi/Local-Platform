import { render } from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";
import { VisitorPositionProvider } from "@/geo/VisitorPosition";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";

/** The providers the app's root layout gives every screen. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppIntlProvider>
      <VisitorPositionProvider>{children}</VisitorPositionProvider>
    </AppIntlProvider>
  );
}

/** Renders a screen inside the app's providers. A rerender keeps them. */
export function renderScreen(element: ReactElement) {
  return render(element, { wrapper: Providers });
}
