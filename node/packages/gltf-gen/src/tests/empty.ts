/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Test } from '.';
import * as GltfGen from '..';

export default class EmptyTest implements Test {
    public name = 'Empty glTF';
    public shouldPrintJson = false;
    public shouldPrintBuffer = false;

    public async run(): Promise<Buffer> {
        const factory = new GltfGen.GltfFactory();
        return await factory.generateGLTF();
    }
}
