import { displayUrl, formatDate, httpUrl, type PlaceDetail, telHref } from "@queenstown/shared";
import { type ReactNode, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { call, openDirections, openWebsite, shareLink } from "@/links/actions";
import { PlaceImage } from "@/ui/PlaceImage";
import { colors, TOUCH } from "@/ui/theme";
import { ActionProblem, DetailRow, DetailText, detailStyles, SideButton } from "./DetailParts";

/**
 * Place detail (wireframe m-place, PLACE-04 ~ PLACE-06): picture, name and category, the quick
 * actions right under them, description, address with "View on map", opening hours, contact, and
 * the source with the date it was updated. Rows the place has no value for are left out.
 */
export function PlaceDetailView({
  place,
  onViewOnMap,
  favorite,
}: {
  place: PlaceDetail;
  onViewOnMap: () => void;
  /** The heart beside the name (FAV-01). */
  favorite?: ReactNode;
}) {
  const t = useTranslations("Place");
  const tCategory = useTranslations("Category");
  const tSubtype = useTranslations("Subtype");
  const [problem, setProblem] = useState<string | null>(null);

  const canCall = place.phone !== null && telHref(place.phone) !== null;
  const website = place.website ? httpUrl(place.website) : null;
  const source = httpUrl(place.sourceUrl);
  const kind =
    place.subtype && place.subtype !== "other"
      ? `${tCategory(place.category)} · ${tSubtype(place.subtype)}`
      : tCategory(place.category);

  async function run(action: () => Promise<boolean>) {
    setProblem(null);
    if (!(await action())) {
      setProblem(t("openFailed"));
    }
  }

  const actions = [
    canCall && place.phone ? { label: t("call"), action: () => call(place.phone as string) } : null,
    website ? { label: t("website"), action: () => openWebsite(website) } : null,
    { label: t("directions"), action: () => openDirections(place, place.name) },
    { label: t("share"), action: () => shareLink(place.name, `/places/${encodeURIComponent(place.slug)}`) },
  ].filter((item) => item !== null);

  return (
    <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.content}>
      <PlaceImage url={place.imageUrl} label={place.name} style={detailStyles.image} />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={detailStyles.title}>
            {place.name}
          </Text>
          <Text style={detailStyles.kind}>{kind}</Text>
        </View>
        {favorite}
      </View>

      <View accessibilityLabel={t("actions")} style={styles.actions}>
        {actions.map(({ label, action }) => (
          <Pressable key={label} accessibilityRole="button" onPress={() => void run(action)} style={styles.action}>
            <Text style={styles.actionText}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <ActionProblem text={problem} />

      {place.description ? <DetailText>{place.description}</DetailText> : null}

      <DetailRow title={t("address")} action={<SideButton role="link" label={t("viewOnMap")} onPress={onViewOnMap} />}>
        <DetailText>{place.address}</DetailText>
      </DetailRow>

      {place.openingHours ? (
        <DetailRow title={t("openingHours")}>
          <DetailText>{place.openingHours}</DetailText>
        </DetailRow>
      ) : null}

      {place.phone || website ? (
        <DetailRow title={t("contact")}>
          {place.phone ? (
            canCall ? (
              <LinkText text={place.phone} onPress={() => void run(() => call(place.phone as string))} />
            ) : (
              <DetailText>{place.phone}</DetailText>
            )
          ) : null}
          {website ? <LinkText text={displayUrl(website)} onPress={() => void run(() => openWebsite(website))} /> : null}
        </DetailRow>
      ) : null}

      <View style={styles.footer}>
        {source ? (
          <Pressable accessibilityRole="link" onPress={() => void run(() => openWebsite(source))} style={styles.sourceLink}>
            <Text style={styles.footerText}>{t("source", { source: place.source })}</Text>
          </Pressable>
        ) : (
          <Text style={styles.footerText}>{t("source", { source: place.source })}</Text>
        )}
        <Text style={styles.footerText}>{t("updated", { date: formatDate(place.updatedAt) })}</Text>
      </View>
    </ScrollView>
  );
}

function LinkText({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.linkPress}>
      <Text style={styles.link}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  headerText: { flex: 1 },
  actions: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    minHeight: TOUCH,
    paddingHorizontal: 4,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" },
  linkPress: { minHeight: TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  link: { fontSize: 16, color: colors.link, textDecorationLine: "underline" },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line, paddingTop: 8, gap: 4 },
  sourceLink: { minHeight: TOUCH, justifyContent: "center", alignSelf: "flex-start" },
  footerText: { fontSize: 14, color: colors.faint },
});
