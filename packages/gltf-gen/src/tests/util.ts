/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console */

/** @hidden */
export function prettyPrintBuffer(buffer: Buffer, offset = 0, labelOffsetAsZero = false) {
	const offsetDigitCount = Math.ceil(Math.log2(buffer.length) / 4);

	// loop over lines
	for (let i = offset; i < buffer.length; i += 16) {

		// line label
		const offsetStringValue = labelOffsetAsZero ? i - offset : i;
		const offsetString = offsetStringValue.toString(16).padStart(offsetDigitCount, '0');

		// byte data
		const byteString = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]]
			.map(group => {
				return group.map(bi => {
					const byte = i + bi;
					return byte >= buffer.length ? '  ' : buffer.toString('hex', byte, byte + 1);
				}).join(' ');
			}).join('  ');

		// byte data in ascii encoding (non-control characters only)
		const asciiString = buffer.toString('ascii', i, i + 16)
			.split('').map(c => {
				const code = c.charCodeAt(0);
				return code >= 0x20 ? c : ' ';
			}).join('');

		console.log(`${offsetString}  |  ${byteString}  |  ${asciiString}`);
	}
}
