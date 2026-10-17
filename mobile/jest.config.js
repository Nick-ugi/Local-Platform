const path = require("node:path");

// The app runs React 19.2.3 (Expo SDK 57) next to the web app's 19.3.0, so npm keeps the app's
// copy in mobile/node_modules and the web's at the root. Libraries hoisted to the root would find
// the root copy and render with a second React. Metro picks the app's copy on its own; Jest
// resolves like Node, so every "react" import is sent to the app's copy here.
const appReact = path.dirname(require.resolve("react/package.json", { paths: [__dirname] }));

// expo-router's test helpers load @testing-library/react-native themselves, and npm installed the
// newest one at the root for them. They are written for version 13 (a render that returns at
// once), so they get the app's copy too.
const appTestingLibrary = path.dirname(
  require.resolve("@testing-library/react-native/package.json", { paths: [__dirname] }),
);

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // The first render of a screen in a test file loads React Native, expo-router and the map module.
  // With a test file on every core that took longer than Jest's default 5 seconds, and two to four
  // of those first tests timed out at random. The tests are not slow once that is done.
  testTimeout: 15000,
  setupFiles: ["@rnmapbox/maps/setup-jest", "./jest.setup.js"],
  moduleNameMapper: {
    "^react$": appReact,
    "^react/(.*)$": `${appReact}/$1`,
    "^@testing-library/react-native$": appTestingLibrary,
  },
  // These packages ship modern JavaScript (or TypeScript, for @queenstown/shared) that has to go
  // through Babel like the app's own code.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@rnmapbox/.*|use-intl|@formatjs/.*|intl-messageformat|standard-navigation|@queenstown/.*)",
  ],
};
