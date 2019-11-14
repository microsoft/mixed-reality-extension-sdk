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
		"block-spacing": ["warn", "always"],
		"brace-style": ["warn", "1tbs", {"allowSingleLine": true}],
		"camelcase": ["warn", {"allow": ["^_[a-z][A-Za-z0-9]*$"]}],
		"curly": ["warn", "all"],
		"default-param-last": "warn",
		"eol-last": ["warn", "always"],
		"eqeqeq": ["error", "always"],
		"indent": [
			"warn",
			"tab",
			{
				"MemberExpression": "off",
				"SwitchCase": 1
			}
		],
		"linebreak-style": [
			"warn",
			"windows"
		],
		"max-classes-per-file": ["warn", 1],
		"max-len": ["error", 120],
		"no-console": "error",
		"no-div-regex": "error",
		"no-empty": ["error", { "allowEmptyCatch": true }],
		"no-labels": "error",
		"no-loop-func": "error",
		"no-multi-spaces": ["warn", {"ignoreEOLComments": true}],
		"no-multiple-empty-lines": "warn",
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
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-floating-promises": "off",
		"@typescript-eslint/no-misused-promises": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{ "args": "none" }
		],
		"@typescript-eslint/unbound-method": "error",
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