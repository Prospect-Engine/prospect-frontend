import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-anonymous-default-export": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      // Disable React hooks exhaustive deps warnings
      "react-hooks/exhaustive-deps": "off",
      // Disable Next.js img element warnings
      "@next/next/no-img-element": "off",
      // Disable JSX accessibility warnings
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/img-redundant-alt": "off",
      "jsx-a11y/aria-props": "off",
      "jsx-a11y/aria-proptypes": "off",
      "jsx-a11y/aria-unsupported-elements": "off",
      "jsx-a11y/role-has-required-aria-props": "off",
      "jsx-a11y/role-supports-aria-props": "off",
      // Disable other common warnings
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      // Disable unused eslint-disable directive warnings
      "@eslint-community/eslint-comments/no-unused-disable": "off",
      "eslint-comments/no-unused-disable": "off",
      // Disable all ESLint directive warnings
      "@eslint-community/eslint-comments/no-unused-eslint-disable": "off",
      "eslint-comments/no-unused-eslint-disable": "off",
    },
  },
];

export default eslintConfig;
