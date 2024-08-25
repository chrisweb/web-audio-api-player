import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/node_modules",
        "**/dist",
        "**/build",
        "**/scripts",
        "**/package.json",
        "**/package-lock.json",
    ],
}, ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, "off"])),
        },

        parser: tsParser,
    },

    rules: {
        "@typescript-eslint/naming-convention": ["warn", {
            selector: "interface",
            format: ["PascalCase"],

            custom: {
                regex: "^I[A-Z]",
                match: true,
            },
        }],
    },
}];