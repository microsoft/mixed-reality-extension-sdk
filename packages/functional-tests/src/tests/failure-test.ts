/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Test } from '../test';

export default class FailureTest extends Test {
    public expectedResultDescription = "Fails";

    public async run(): Promise<boolean> {
        throw new Error("Throwing an exception");
    }
}
