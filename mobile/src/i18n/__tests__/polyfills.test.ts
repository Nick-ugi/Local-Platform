import { createTranslator } from "use-intl";
import messages from "@/messages/en.json";

// The app's engine (Hermes) has no Intl.PluralRules. Without it a plural message fails to format,
// as it did on the emulator; with the polyfill loaded it counts in English.
test("plural messages format on an engine without Intl.PluralRules", () => {
  const intl = Intl as { PluralRules?: typeof Intl.PluralRules };
  const native = intl.PluralRules;
  // Removed to stand for Hermes.
  delete intl.PluralRules;
  try {
    jest.isolateModules(() => {
      // Loaded afresh, with the engine as Hermes has it.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../polyfills");
    });
    const t = createTranslator({ locale: "en", messages, namespace: "Search" });

    expect(t("count", { count: 1 })).toBe("1 result");
    expect(t("count", { count: 12 })).toBe("12 results");
  } finally {
    intl.PluralRules = native;
  }
});
