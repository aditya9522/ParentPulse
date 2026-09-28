// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native Animated and PanResponder intentionally keep mutable native handles in refs.
      // The React DOM compiler-oriented rule reports those official RN patterns as render reads.
      "react-hooks/refs": "off",
    },
  }
]);
