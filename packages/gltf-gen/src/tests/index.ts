/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable */
const validator = require('gltf-validator');
import Empty from './empty';
import Material from './material';
import PrimDupe from './prim-dupe';
import Triangle from './triangle';
import MeshPrimitive from './meshprimitive';
import { prettyPrintBuffer } from './util';

/** @hidden */
export interface Test {
	name: string;
	shouldPrintJson: boolean;
	shouldPrintBuffer: boolean;
	run(): Buffer;
}

(async () => {

	const tests: Test[] = [new Empty(), new Triangle(), new PrimDupe(), new Material(), new MeshPrimitive()];

	for (const test of tests) {
		console.log(
			`+==========================================+
| ${test.name.padEnd(40, ' ')} |
+==========================================+`);

		let time = process.hrtime();
		let result: Buffer;
		try {
			result = test.run();
		} catch (ex) {
			console.log('Test failed', ex);
			continue;
		}
		time = process.hrtime(time);
		console.log(`Test completed in ${time[0] * 1000 + time[1] / 1000} ms\n`);

		const jsonStart = 20;
		const jsonLength = result.readInt32LE(12);
		if (test.shouldPrintJson) {
			console.log('Output JSON:');
			console.log('-' + result.toString('utf8', jsonStart, jsonStart + jsonLength) + '-\n');
		}

		if (test.shouldPrintBuffer) {
			console.log('Output Data:');
			prettyPrintBuffer(result, jsonStart + jsonLength + 8);
		}

		const validationResult = await validator.validateBytes(new Uint8Array(result));
		console.log('Validation issues:', JSON.stringify(validationResult.issues.messages, null, '  '), '\n');
	}

})();
