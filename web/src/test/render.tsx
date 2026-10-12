import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import messages from "../../messages/en.json";

function WithMessages({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

/**
 * Renders a component with the real English messages, as the root layout provides them. The
 * messages stay in place when a test renders again with `rerender`.
 */
export function renderWithMessages(ui: ReactElement) {
  return render(ui, { wrapper: WithMessages });
}
