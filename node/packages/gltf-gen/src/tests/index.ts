/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// tslint:disable-next-line
const validator = require('gltf-validator');
import Empty from './empty';
import Material from './material';
import PrimDupe from './prim-dupe';
import Triangle from './triangle';
import { prettyPrintBuffer } from './util';

export interface Test {
    name: string;
    shouldPrintJson: boolean;
    shouldPrintBuffer: boolean;
    run(): Promise<Buffer>;
}

// the whole point of this file is to output the test results to the console
// tslint:disable:no-console

// currently no way to run async code from top of file. must be in a function
// tslint:disable-next-line:no-floating-promises
(async () => {

    const tests: Test[] = [new Empty(), new Triangle(), new PrimDupe(), new Material()];

    for (const test of tests) {
        console.log(
            `+==========================================+
| ${test.name.padEnd(40, ' ')} |
+==========================================+`);

        let time = process.hrtime();
        let result: Buffer;
        try {
            result = await test.run();
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
