/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export function safeAccessPath(obj: any, ...path: any[]): any {
	for (const part of path) {
		if (!obj[part]) {
			return undefined;
		} else {
			obj = obj[part];
		}
	}
	return obj;
}
