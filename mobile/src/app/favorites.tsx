import { useRouter } from "expo-router";
import { FavoritesScreen } from "@/auth/FavoritesScreen";

/** Favorites, on top of More. */
export default function FavoritesRoute() {
  const router = useRouter();
  return (
    <FavoritesScreen
      onOpen={(place) => router.push(`/places/${encodeURIComponent(place.slug)}`)}
      onLogin={() => router.push("/login")}
      onExplore={() => router.dismissTo("/explore")}
    />
  );
}
