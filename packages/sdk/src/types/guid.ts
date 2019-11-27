/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** A string composed hexadecimal characters in groups of 8, 4, 4, 4, and 12, separated by dashes (`-`). */
export interface Guid extends String {
	__is_guid: never;
}

/** Convert a string to a Guid */
export function parseGuid(val: string): Guid {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u.test(val)) {
		throw new Error(`Not a valid GUID: <${val}>`);
	}
	return (val as unknown) as Guid;
}
