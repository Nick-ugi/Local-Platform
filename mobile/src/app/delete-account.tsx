import { useRouter } from "expo-router";
import { DeleteAccountScreen } from "@/auth/DeleteAccountScreen";

/** Delete account, on top of More (Google Play asks apps with sign up for this). */
export default function DeleteAccountRoute() {
  const router = useRouter();
  return <DeleteAccountScreen onDone={() => router.back()} onLogin={() => router.push("/login")} />;
}
