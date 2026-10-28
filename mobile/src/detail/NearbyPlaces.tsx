import {
  categoryStyle,
  formatDistance,
  NEARBY_FETCH,
  type PlaceDetail,
  type PlaceSummary,
  pickNearby,
} from "@queenstown/shared";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { getPlaces } from "@/api/places";
import { KindDot } from "@/ui/KindArt";
import { colors, TOUCH } from "@/ui/theme";

/**
 * "Nearby" on a place's screen (PLACE-08): a few places close to it, each with its kind and
 * distance, that open their own screen. Nothing at all until they come, when there are none, or
 * when the list fails: the place's screen stands without them. The web app's list
 * (web/src/components/place/NearbyList.tsx).
 */
export function NearbyPlaces({ place, onOpen }: { place: PlaceDetail; onOpen: (slug: string) => void }) {
  const t = useTranslations("Place");
  const tCategory = useTranslations("Category");
  const [nearby, setNearby] = useState<{
    slug: string;
    places: PlaceSummary[];
  } | null>(null);
  const { slug, latitude, longitude } = place;

  useEffect(() => {
    const controller = new AbortController();
    getPlaces({ position: { latitude, longitude }, size: NEARBY_FETCH }, { signal: controller.signal }).then(
      (page) => {
        if (!controller.signal.aborted) {
          setNearby({ slug, places: pickNearby(page.items, { slug }) });
        }
      },
      () => {
        // The screen stands without its neighbours.
      },
    );
    return () => controller.abort();
  }, [slug, latitude, longitude]);

  const places = nearby?.slug === slug ? nearby.places : [];
  if (places.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        {t("nearby")}
      </Text>
      {places.map((near) => (
        <Pressable key={near.slug} accessibilityRole="link" onPress={() => onOpen(near.slug)} style={styles.row}>
          <KindDot color={categoryStyle(near).color} />
          <View style={styles.text}>
            <Text style={styles.name}>{near.name}</Text>
            <Text style={styles.line}>
              {near.distanceM === null
                ? tCategory(near.category)
                : `${tCategory(near.category)} · ${formatDistance(near.distanceM)}`}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingTop: 12,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  row: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  line: { fontSize: 14, color: colors.muted },
});
