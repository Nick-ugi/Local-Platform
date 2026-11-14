import Ionicons from "@react-native-vector-icons/ionicons";
import type { ComponentProps } from "react";
import { colors } from "./theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * An icon from Ionicons, as the tabs have. Decorative: the text or label beside it says what it
 * means, so screen readers pass over it.
 */
export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
