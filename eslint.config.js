import neostandard from "neostandard";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const webFiles = ["apps/web/src/**/*.{ts,tsx}"];

export default [
  {
    ignores: ["**/dist/"],
  },
  // Bug checks only: code style is a convention (tactris's), not enforced, as in tactris.
  ...neostandard({ ts: true, noStyle: true }),
  // neostandard's default can't parse import attributes (`with { type: "json" }`) in webpack.config.js.
  { files: ["**/*.js"], languageOptions: { ecmaVersion: "latest" } },
  ...[react.configs.flat.recommended, react.configs.flat["jsx-runtime"], reactHooks.configs.flat.recommended].map((config) => ({
    ...config,
    files: webFiles,
    settings: { ...config.settings, react: { version: "detect" } },
  })),
];
