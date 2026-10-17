import { useRouter } from "expo-router";
import { AuthScreen } from "@/auth/AuthScreen";

/** Log in, on top of the screen that asked for it; back there once signed in. */
export default function LoginRoute() {
  const router = useRouter();
  return <AuthScreen mode="login" onDone={() => router.back()} onSwitch={() => router.replace("/signup")} />;
}
