import { httpUrl } from "@queenstown/shared";
import { useState } from "react";
import { Image, type ImageStyle, type StyleProp, View, type ViewStyle } from "react-native";

type Props = {
  url: string | null;
  /** Read out for the picture, or "" when the text beside it already says what it shows. */
  label: string;
  style: StyleProp<ImageStyle>;
  /** Drawn in place of a missing picture; nothing when left out. */
  placeholderStyle?: StyleProp<ViewStyle>;
};

/**
 * The picture of a place or event. Seed data names images by URL, and an address can be wrong or
 * go away, so a picture that is not an http(s) URL or fails to load gives way to the placeholder.
 * The web app's rule (web/src/components/place/PlaceImage.tsx).
 */
export function PlaceImage({ url, label, style, placeholderStyle }: Props) {
  // The address that failed, so that a different address gets its own attempt.
  const [failed, setFailed] = useState<string | null>(null);
  const safe = url ? httpUrl(url) : null;

  if (safe === null || safe === failed) {
    return placeholderStyle ? <View testID="image-placeholder" style={placeholderStyle} /> : null;
  }
  return (
    <Image
      source={{ uri: safe }}
      style={style}
      resizeMode="cover"
      accessible={label !== ""}
      accessibilityLabel={label || undefined}
      onError={() => setFailed(safe)}
    />
  );
}
