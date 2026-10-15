import { Tabs } from "expo-router";
import { useTranslations } from "use-intl";

/**
 * Map, Explore and More (NAV-02, wireframe a-map). Local is a Should for the app. The tabs have
 * labels only until the app gets its icons.
 */
export default function TabsLayout() {
  const t = useTranslations("Nav");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a0a0a",
        tabBarInactiveTintColor: "#737373",
        tabBarIconStyle: { display: "none" },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("map"), headerShown: false }} />
      <Tabs.Screen name="explore" options={{ title: t("explore"), headerShown: false }} />
      <Tabs.Screen name="more" options={{ title: t("more") }} />
    </Tabs>
  );
}
