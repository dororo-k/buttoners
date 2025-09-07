module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "google",
  ],
  globals: {
    firebase: true,
    // Add other global variables if needed
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json"],
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
  ],
  rules: {
    "indent": ["error", 2],
    "object-curly-spacing": ["error", "always"], // Fix: Ensure space inside curly braces
    "quotes": ["error", "single"], // Fix: Use single quotes
    "no-unused-vars": "off", // Disable default no-unused-vars
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }], // Enable TS-specific no-unused-vars
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "max-len": ["error", { "code": 100, "ignoreUrls": true }], // Max line length 100
    "require-jsdoc": "off", // Disable JSDoc requirement
    "valid-jsdoc": "off", // Disable JSDoc validation
    "camelcase": "off", // Allow non-camelcase for Firestore fields
    "@typescript-eslint/camelcase": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
};