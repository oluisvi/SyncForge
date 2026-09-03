import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import globals from "globals";

const sourceFiles = ["**/*.{js,mjs,cjs,jsx,ts,tsx}"];
const typeScriptFiles = ["**/*.{ts,tsx}"];
const webFiles = ["apps/web/**/*.{js,mjs,cjs,jsx,ts,tsx}"];
const tsRecommended = tsPlugin.configs["flat/recommended"];

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/generated/**",
      "**/src/generated/prisma/**",
    ],
  },
  {
    ...eslint.configs.recommended,
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
  },
  {
    files: typeScriptFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsRecommended[1].rules,
      ...tsRecommended[2].rules,
    },
  },
  {
    files: webFiles,
    plugins: {
      "@next/next": nextPlugin,
    },
    settings: {
      next: { rootDir: "apps/web" },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  prettier,
];
