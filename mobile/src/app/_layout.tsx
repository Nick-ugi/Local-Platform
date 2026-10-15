import { Stack } from "expo-router";
import { useTranslations } from "use-intl";
import { VisitorPositionProvider } from "@/geo/VisitorPosition";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";

function RootStack() {
  const t = useTranslations("Pages");

  // The tabs, with the screens that open on top of them (docs/02-information-architecture.md, App).
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: t("search") }} />
      <Stack.Screen name="places/[slug]" options={{ title: "" }} />
      <Stack.Screen name="events/[slug]" options={{ title: "" }} />
      <Stack.Screen name="notices/[slug]" options={{ title: "" }} />
      <Stack.Screen name="about" options={{ title: t("about") }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppIntlProvider>
      <VisitorPositionProvider>
        <RootStack />
      </VisitorPositionProvider>
    </AppIntlProvider>
  );
}
