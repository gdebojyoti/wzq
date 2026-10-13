import neostandard from "neostandard";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const webFiles = ["apps/web/src/**/*.{ts,tsx}"];

export default [
  {
    ignores: ["**/dist/"],
  },
  ...neostandard({ ts: true, semi: true }),
  // tactris's style, where it differs from standard's.
  {
    rules: {
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/jsx-quotes": ["error", "prefer-double"],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/member-delimiter-style": ["error", {
        multiline: { delimiter: "semi", requireLast: true },
        singleline: { delimiter: "semi", requireLast: false },
      }],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/space-before-function-paren": ["error", { anonymous: "always", named: "never", asyncArrow: "always" }],
      // Components are `export default function`, which this allows; helpers are arrow-function constants.
      "func-style": ["error", "expression"],
    },
  },
  // neostandard's default can't parse import attributes (`with { type: "json" }`) in webpack.config.js.
  { files: ["**/*.js"], languageOptions: { ecmaVersion: "latest" } },
  ...[react.configs.flat.recommended, react.configs.flat["jsx-runtime"], reactHooks.configs.flat.recommended].map((config) => ({
    ...config,
    files: webFiles,
    settings: { ...config.settings, react: { version: "detect" } },
  })),
];
