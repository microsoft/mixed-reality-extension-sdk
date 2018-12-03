/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class GltfAnimationTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runGltfAnimationTest();

        return success;
    }

    public async runGltfAnimationTest(): Promise<boolean> {
        const tester = await MRESDK.Actor.CreateFromGLTF(this.app.context, {
            resourceUrl: `https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`,
            actor: {
                transform: {
                    // rotation: Math3D.Quaternion.Euler(0, 180, 0)
                }
            }
        });
        tester.startAnimation('animation:0');
        this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "start animation");
        await delay(6000);
        tester.stopAnimation('animation:0');
        this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "stop animation");
        await delay(2000);

        destroyActors(tester);

        return true;
    }
}
