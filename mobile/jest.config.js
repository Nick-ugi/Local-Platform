/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // @queenstown/shared ships TypeScript source, so it has to go through Babel like the app's own code.
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@rnmapbox/.*|use-intl|@queenstown/.*)",
  ],
};
