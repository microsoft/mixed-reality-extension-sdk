/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfAnimationTest extends Test {
    public expectedResultDescription = "Cesium Man walking";

    public async run(): Promise<boolean> {
        const tester = await MRESDK.Actor.CreateFromGltf(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`
        });
        tester.enableAnimation('animation:0');
        this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "start animation");

        await this.stoppedAsync();

        tester.disableAnimation('animation:0');
        this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "stop animation");

        return true;
    }
}
