import type { ConfigContext, ExpoConfig } from "expo/config";

// The app's native configuration (Continuous Native Generation): android/ and ios/ are generated
// from this file by `expo prebuild` or `expo run:android`, and are not committed.
//
// APP_VARIANT=production marks a release build. Only development builds may call the backend over
// plain http, which is how the emulator reaches the PC (http://10.0.2.2:8080).
const isProduction = process.env.APP_VARIANT === "production";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Queenstown Local",
  slug: "queenstown-local",
  // The web has its own app (web/). Without this, `expo start` also tries to bundle for the
  // browser and prints "Web Bundling failed".
  platforms: ["android", "ios"],
  scheme: "queenstownlocal",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.queenstownlocal.app",
  },
  android: {
    package: "com.queenstownlocal.app",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "@rnmapbox/maps",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Queenstown Local shows where you are on the map and what is near you.",
      },
    ],
    ["expo-build-properties", { android: { usesCleartextTraffic: !isProduction } }],
  ],
});
