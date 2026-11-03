import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { useTranslations } from "use-intl";

type IconName = ComponentProps<typeof Ionicons>["name"];

/** A tab's icon: filled for the open tab, outlined for the others. The label beside it is what is read out. */
function tabIcon(name: string) {
  function TabIcon({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) {
    return <Ionicons name={(focused ? name : `${name}-outline`) as IconName} size={size} color={color} />;
  }
  return TabIcon;
}

/** Map, Explore, Local and More (NAV-02, APP-01, wireframe a-map), the order of the web app's menu. */
export default function TabsLayout() {
  const t = useTranslations("Nav");

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0a0a0a",
        tabBarInactiveTintColor: "#737373",
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("map"), headerShown: false, tabBarIcon: tabIcon("map") }} />
      <Tabs.Screen name="explore" options={{ title: t("explore"), headerShown: false, tabBarIcon: tabIcon("list") }} />
      <Tabs.Screen name="local" options={{ title: t("local"), headerShown: false, tabBarIcon: tabIcon("calendar") }} />
      <Tabs.Screen name="more" options={{ title: t("more"), tabBarIcon: tabIcon("ellipsis-horizontal") }} />
    </Tabs>
  );
}
