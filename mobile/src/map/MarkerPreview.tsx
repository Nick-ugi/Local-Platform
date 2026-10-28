import { formatEventWhen, type MapMarker } from "@queenstown/shared";
import { useEffect, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { NoticeBadges } from "@/local/NoticeBadges";
import { useNoticePeriodText } from "@/local/useNoticePeriod";
import { OpenBadge } from "@/ui/OpenBadge";
import { colors, TOUCH } from "@/ui/theme";

type Props = {
  marker: MapMarker;
  /** The distance from the visitor, already formatted, or null when their position is unknown. */
  distanceText: string | null;
  onOpen: () => void;
  onClose: () => void;
};

/** How far the card has to be pulled down before letting go closes it. */
const CLOSE_PULL = 60;

/**
 * The card of the marker selected on the map (wireframe a-map, 2): a sheet at the bottom with the
 * way on to the detail screen. A place shows its name, category and distance, and whether it is open
 * now (PLACE-07); an event its title, time and venue; a notice its type, Official mark, title and
 * period. Pulling it down or the close button closes it.
 */
export function MarkerPreview({ marker, distanceText, onOpen, onClose }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");
  const periodText = useNoticePeriodText();

  // A pull far enough down closes the card. The pull is set up once, on the first render, so it
  // says so through state and the effect below calls the latest onClose.
  const [pulledAway, setPulledAway] = useState(false);
  useEffect(() => {
    if (pulledAway) {
      onClose();
    }
  }, [pulledAway, onClose]);
  const [pull] = useState(() => new Animated.Value(0));
  const [responder] = useState(() => {
    const settle = () => Animated.spring(pull, { toValue: 0, useNativeDriver: true }).start();
    return PanResponder.create({
      // Only a pull that is mostly downwards is the card's; a tap stays with the buttons.
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => pull.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > CLOSE_PULL) {
          setPulledAway(true);
        }
        settle();
      },
      onPanResponderTerminate: settle,
    });
  });

  const title = marker.kind === "place" ? marker.name : marker.title;
  const lines: string[] = [];
  if (marker.kind === "place") {
    lines.push(withDistance(tCategory(marker.category), distanceText));
  } else if (marker.kind === "event") {
    lines.push(formatEventWhen(marker.startsAt, marker.endsAt), withDistance(marker.venueName, distanceText));
  } else {
    lines.push(withDistance(periodText(marker.startsAt, marker.endsAt), distanceText));
  }

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: pull }] }]} {...responder.panHandlers}>
      <View style={styles.handle} />
      <View style={styles.body}>
        <View style={styles.text}>
          {marker.kind === "notice" ? <NoticeBadges type={marker.type} isOfficial={marker.isOfficial} /> : null}
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {lines.map((line) => (
            <Text key={line} style={styles.line}>
              {line}
            </Text>
          ))}
          {marker.kind === "place" ? <OpenBadge openingHours={marker.openingHours} /> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("closePreview")}
          onPress={onClose}
          hitSlop={4}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="link" onPress={onOpen} style={styles.open}>
        <Text style={styles.openText}>{t("viewDetails")}</Text>
      </Pressable>
    </Animated.View>
  );
}

function withDistance(text: string, distanceText: string | null): string {
  return distanceText ? `${text} · ${distanceText}` : text;
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 8 },
  body: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  line: { fontSize: 14, color: colors.muted },
  close: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", marginRight: -8 },
  closeText: { fontSize: 24, color: colors.muted },
  open: {
    minHeight: TOUCH,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  openText: { color: colors.paper, fontSize: 14, fontWeight: "600" },
});
