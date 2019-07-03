/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 * If `obj` is an empty object, return undefined.
 */
export default function filterEmpty(obj: any) {
	if (typeof obj === 'object' && obj !== null && !Object.keys(obj).length) {
		return undefined;
	} else {
		return obj;
	}
}
