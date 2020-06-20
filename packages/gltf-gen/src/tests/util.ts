/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console */

/** @hidden */
export function prettyPrintBuffer(buffer: Buffer, offset: number) {
	const offsetDigitCount = Math.ceil(Math.log2(buffer.length - offset) / 4);

	// loop over lines
	for (let i = 0; (offset + i) < buffer.length; i += 16) {

		// line label
		const offsetString = i.toString(16).padStart(offsetDigitCount, '0');

		// byte data
		const byteString = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]]
			.map(group => {
				return group.map(bi => {
					const byte = offset + i + bi;
					return byte >= buffer.length ? '  ' : buffer.toString('hex', byte, byte + 1);
				}).join(' ');
			}).join('  ');

		// byte data in ascii encoding (non-control characters only)
		const asciiString = buffer.toString('ascii', offset + i, offset + i + 16)
			.split('').map((c, i) => {
				const code = c.charCodeAt(0);
				return code >= 0x20 ? c : ' ';
			}).join('');

		console.log(`${offsetString}  |  ${byteString}  |  ${asciiString}`);
	}
}
