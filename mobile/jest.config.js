/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // The first render of a screen in a test file loads React Native, expo-router and the map module.
  // With a test file on every core that took longer than Jest's default 5 seconds, and two to four
  // of those first tests timed out at random. The tests are not slow once that is done.
  testTimeout: 15000,
  setupFiles: ["@rnmapbox/maps/setup-jest", "./jest.setup.js"],
  // These packages ship modern JavaScript (or TypeScript, for @queenstown/shared) that has to go
  // through Babel like the app's own code.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@rnmapbox/.*|use-intl|@formatjs/.*|intl-messageformat|standard-navigation|@queenstown/.*)",
  ],
};
