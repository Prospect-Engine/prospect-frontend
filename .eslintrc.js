module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js", "src/iconify-bundle/**/*"],
  rules: {
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "import/no-anonymous-default-export": "off",
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
  },
};
