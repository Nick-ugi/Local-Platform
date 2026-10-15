import "./polyfills";
import type { ReactNode } from "react";
import { IntlProvider } from "use-intl";
import messages from "@/messages/en.json";

/**
 * The app's words (COMMON-04). use-intl is the core of the next-intl the web app uses, so both
 * read messages the same way, with the same keys where the words are the same. English only for
 * now; dates and times are New Zealand's wherever the phone is.
 */
export function AppIntlProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider locale="en" messages={messages} timeZone="Pacific/Auckland">
      {children}
    </IntlProvider>
  );
}
