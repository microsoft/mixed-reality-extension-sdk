module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended"
	],
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly"
	},
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint"
	],
	"rules": {
		"indent": [
			"error",
			"tab",
			{
				"MemberExpression": "off",
				"SwitchCase": 1
			}
		],
		"linebreak-style": [
			"error",
			"windows"
		],
		"max-len": ["error", 120],
		"no-console": ["error"],
		"no-empty": ["error", { "allowEmptyCatch": true }],
		"semi": "off",
		"@typescript-eslint/semi": ["error"],
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": ["warn"]
	}
};