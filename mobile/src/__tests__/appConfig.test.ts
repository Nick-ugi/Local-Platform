import type { ExpoConfig } from "expo/config";
import appConfig from "../../app.config";

/** The app's configuration as Expo reads it. */
function configFor(): ExpoConfig {
  return appConfig({ config: {} } as never);
}

test("Android asks only for location and the network: the template's other permissions are blocked", () => {
  expect(configFor().android?.blockedPermissions).toEqual([
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.VIBRATE",
  ]);
});

test("the icon and the splash screen use the brand's blue", () => {
  const config = configFor();

  expect(config.android?.adaptiveIcon).toEqual({
    backgroundColor: "#0369a1",
    foregroundImage: "./assets/android-icon-foreground.png",
    monochromeImage: "./assets/android-icon-monochrome.png",
  });
  expect(config.plugins).toContainEqual([
    "expo-splash-screen",
    { image: "./assets/splash-icon.png", imageWidth: 200, resizeMode: "contain", backgroundColor: "#0369a1" },
  ]);
});

test("the app stays light on a phone in dark mode, and has the icon font for its tabs", () => {
  const config = configFor();

  expect(config.userInterfaceStyle).toBe("light");
  expect(config.plugins).toEqual(
    expect.arrayContaining(["expo-system-ui", "expo-font", "@react-native-vector-icons/ionicons"]),
  );
});
