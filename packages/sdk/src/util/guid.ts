/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';

/** A string composed hexadecimal characters in groups of 8, 4, 4, 4, and 12, separated by dashes (`-`). */
export interface Guid extends String {
	__is_guid: never;
}

/** Convert a string to a Guid */
export function parseGuid(val: string | Guid): Guid {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(val.toString())) {
		throw new Error(`Not a valid GUID: <${val}>`);
	}
	return (val.toLowerCase() as unknown) as Guid;
}

export function newGuid(): Guid {
	return parseGuid(UUID());
}
export const ZeroGuidString = '00000000-0000-0000-0000-000000000000';
export const ZeroGuid = parseGuid(ZeroGuidString);
