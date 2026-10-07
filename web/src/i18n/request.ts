import { getRequestConfig } from "next-intl/server";

// One language for now. Adding a language means resolving the locale here.
export default getRequestConfig(async () => ({
  locale: "en",
  messages: (await import("../../messages/en.json")).default,
}));
