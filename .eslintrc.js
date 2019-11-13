module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking"
	],
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly"
	},
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module",
		"project": "./packages/*/tsconfig.json"
	},
	"plugins": [
		"@typescript-eslint",
		"header"
	],
	"rules": {
		"block-spacing": ["error", "always"],
		"brace-style": ["error", "1tbs", {"allowSingleLine": true}],
		"camelcase": ["warn", {"allow": ["^_"]}],
		"curly": ["error", "all"],
		"default-param-last": "warn",
		"eol-last": ["error", "always"],
		"eqeqeq": ["error", "always"],
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
		"no-console": "error",
		"no-div-regex": "error",
		"no-empty": ["error", { "allowEmptyCatch": true }],
		"no-labels": "error",
		"no-loop-func": "error",
		"no-multi-spaces": ["warn", {"ignoreEOLComments": true}],
		"no-new": "error",
		"no-self-compare": "warn",
		"no-sequences": "error",
		"no-shadow": "warn",
		"no-unmodified-loop-condition": "error",
		"no-void": "error",
		"no-warning-comments": ["warn", {"terms": ["todo", "fixme", "tslint"]}],
		"prefer-const": "warn",
		"prefer-regex-literals": "warn",
		"require-unicode-regexp": "error",
		"yoda": "warn",

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
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-floating-promises": "error",
		"@typescript-eslint/no-misused-promises": "off",
		/* "@typescript-eslint/no-unused-vars": [
			"warn",
			{ "args": "none" }
		], */
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