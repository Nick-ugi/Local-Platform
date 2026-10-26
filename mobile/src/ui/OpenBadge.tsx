import { type OpenStatus, openStatus, parseOpeningHours } from "@queenstown/shared";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

const MINUTE = 60 * 1000;

/**
 * Whether a place is open now (PLACE-07), from OpenStreetMap opening hours, in New Zealand time
 * wherever the phone is. Hours that cannot be read say nothing: a wrong "Open now" is worse than
 * none. It follows the clock minute by minute. The web app's badge
 * (web/src/components/place/OpenBadge.tsx).
 */
export function OpenBadge({ openingHours }: { openingHours: string | null }) {
  const t = useTranslations("Hours");
  const hours = useMemo(() => parseOpeningHours(openingHours), [openingHours]);
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    if (!hours) {
      return;
    }
    const update = () => setStatus(openStatus(hours, new Date()));
    const first = setTimeout(update, 0);
    const every = setInterval(update, MINUTE);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [hours]);

  if (!hours || !status) {
    return null;
  }

  let text: string;
  let tone: keyof typeof tones;
  if (status.state === "open") {
    tone = status.soon ? "soon" : "open";
    text =
      status.closesAt === null
        ? t("always")
        : status.soon
          ? t("closesSoon", { time: status.closesAt })
          : t("openUntil", { time: status.closesAt });
  } else {
    tone = "closed";
    text =
      status.opensAt === null
        ? t("closed")
        : status.opensAt.day === null
          ? t("opensAt", { time: status.opensAt.time })
          : t("opensOn", { day: status.opensAt.day, time: status.opensAt.time });
  }

  return (
    <View style={[styles.badge, { backgroundColor: tones[tone].background }]}>
      <Text style={[styles.text, { color: tones[tone].text }]}>{text}</Text>
    </View>
  );
}

// Tailwind's green, amber and neutral 50/100 and 800/700, as on the web.
const tones = {
  open: { background: "#f0fdf4", text: "#166534" },
  soon: { background: "#fffbeb", text: "#92400e" },
  closed: { background: "#f5f5f5", text: "#404040" },
};

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: "600" },
});
