import type { MarkerKind } from "@queenstown/shared";
import { Stack, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import { colors } from "@/ui/theme";
import { DetailStateView } from "./DetailStateView";
import { useDetail } from "./useDetail";

type Props<T> = {
  kind: MarkerKind;
  slug: string;
  /** Fetches the item; a stable function, such as getPlace. */
  load: (slug: string, options: { signal: AbortSignal }) => Promise<T | null>;
  /** The header's title once the item is there. */
  titleOf: (item: T) => string;
  children: (item: T, onViewOnMap: () => void) => ReactNode;
};

/**
 * A detail screen on top of the tabs (docs/02-information-architecture.md, App): loads its item,
 * shows the states before it, puts its name in the header, and leads back to the Map with the
 * item selected ("View on map": ?place=, ?event= or ?notice=).
 */
export function DetailRoute<T>({ kind, slug, load, titleOf, children }: Props<T>) {
  const router = useRouter();
  const detail = useDetail(load, slug);

  // The tabs are at the bottom of the stack: going back to them keeps their state.
  const toMap = () => router.dismissTo({ pathname: "/", params: { [kind]: slug } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: detail.status === "ready" ? titleOf(detail.data) : "" }} />
      {detail.status === "ready" ? (
        children(detail.data, toMap)
      ) : (
        <DetailStateView
          status={detail.status}
          retry={detail.retry}
          onGoToMap={() => router.dismissTo("/")}
          onGoToExplore={() => router.dismissTo("/explore")}
        />
      )}
    </View>
  );
}
