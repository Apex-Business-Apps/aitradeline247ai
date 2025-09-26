import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "import": importPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Prevent duplicate imports
      "no-duplicate-imports": ["error", { "includeExports": true }],
      "import/no-duplicates": "error",
      // Ban shadow analytics & extra SW libs
      "no-restricted-imports": ["error", {
        "paths": [
          { "name": "plausible-tracker", "message": "GA4 is the single analytics system." },
          { "name": "posthog-js", "message": "GA4 is the single analytics system." }
        ],
        "patterns": ["**/*service*worker*", "**/*sw-register*"]
      }],
      // Clean imports automatically
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", { 
        "vars": "all", 
        "args": "after-used", 
        "argsIgnorePattern": "^_" 
      }],
    },
  },
);
