import { normalizeQuery } from "@queenstown/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SearchScreen } from "@/places/SearchScreen";

/** Search, on top of the tab it was opened from. The words are in the route as ?q=. */
export default function SearchRoute() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const words = normalizeQuery(q);

  return (
    // A new search starts the screen over from its words.
    <SearchScreen
      key={words}
      q={words}
      onSubmit={(next) => router.setParams({ q: next })}
      onOpen={(place) => router.push(`/places/${encodeURIComponent(place.slug)}`)}
      onExplore={() => router.navigate("/explore")}
    />
  );
}
