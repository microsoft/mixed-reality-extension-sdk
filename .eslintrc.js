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
		"@typescript-eslint",
		"header"
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
		"no-unused-vars": "off",
		"semi": "off",

		"@typescript-eslint/array-type": [
			"error",
			{ "default": "array-simple" }
		],
		"@typescript-eslint/ban-types": [
			"error",
			{
				"types": {
					"Object": "Use {} instead.",
					"String": "Use 'string' instead.",
					"Number": "Use 'number' instead.",
					"Boolean": "Use 'boolean' instead."
				}
			}
		],
		"@typescript-eslint/semi": ["error"],
		"@typescript-eslint/no-unused-vars": ["warn"],
		"header/header": [
			"error",
			"block",
			[
				"!",
				" * Copyright (c) Microsoft Corporation. All rights reserved.",
				" * Licensed under the MIT License.",
				" "
			]
		]
	}
};