import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default tseslint.config(
  {
    ignores: ["**/dist", "eslint.config.mjs"],
  },
  ...fixupConfigRules(
    compat.extends(
      "plugin:react-hooks/recommended",
      "plugin:react/recommended",
      "plugin:react/jsx-runtime",
      "plugin:@typescript-eslint/recommended"
    )
  ),
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        project: [
          "./packages/structured-state/tsconfig.src.json",
          "./packages/structured-state/tsconfig.node.json",
          "./packages/site/tsconfig.src.json",
          "./packages/site/tsconfig.node.json",
        ],
      },
    },

    rules: {
      "@typescript-eslint/no-unnecessary-type-constraint": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  }
);
