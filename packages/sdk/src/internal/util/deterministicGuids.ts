/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as crypto from 'crypto';

// Map for byte <-> hex string conversion
const byteToHex: string[] = [];
for (let i = 0; i < 256; i++) {
	byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function uuidParse(buf: ArrayLike<number>): string {
	let i = 0;
	const bth = byteToHex;
	return (
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] + '-' +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]] +
		bth[buf[i++]] + bth[buf[i++]]);
}

/**
 * @hidden
 * Class for generating a sequence of deterministic GUID values.
 * NOTE: This is a quick hack, and does not generate valid UUIDs.
 * To generate a deterministic sequence of values that are also valid
 * UUIDs, we must employ the "Name-based UUID" method described in
 * RFC 4122 §4.3 (http://www.ietf.org/rfc/rfc4122.txt), which is
 * supported by Node's 'uuid/v3' module.
 */
export class DeterministicGuids {
	constructor(private seed: string) {
	}
	public next(): string {
		const result = this.seed;
		const hashedBytes = crypto.createHash('sha1').update(this.seed, 'ascii').digest();
		const sizedBytes = new Buffer(16);
		sizedBytes.set(hashedBytes);
		this.seed = uuidParse(sizedBytes);
		return result;
	}
}
