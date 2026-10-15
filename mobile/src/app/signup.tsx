import { useRouter } from "expo-router";
import { AuthScreen } from "@/auth/AuthScreen";

/** Sign up, on top of the screen that asked for it; back there once signed in. */
export default function SignupRoute() {
  const router = useRouter();
  return <AuthScreen mode="signup" onDone={() => router.back()} onSwitch={() => router.replace("/login")} />;
}
