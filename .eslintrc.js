module.exports = {
    "env": {
        "browser": true,
        "es2017": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": "tsconfig.json",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "no-case-declarations": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { "argsIgnorePattern": "^_" }
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "semi": "off",
        "@typescript-eslint/semi": ["error"]
    }
};
