/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class GltfConcurrencyTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        const runnerPromise = MRESDK.Actor.CreateFromGLTF(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`,
            actor: {
                transform: {
                    // rotation: Math3D.Quaternion.Euler(0, 180, 0)
                }
            }
        });

        const gearboxPromise = MRESDK.Actor.CreateFromGLTF(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF/GearboxAssy.gltf'
        });

        const bottlePromise = this.app.context.assets.loadGltf('bottle',
            // tslint:disable-next-line:max-line-length
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf');

        let runner: MRESDK.Actor;
        let gearbox: MRESDK.Actor;
        let bottleAsset: MRESDK.AssetGroup;
        try {
            [runner, gearbox, bottleAsset] = await Promise.all([runnerPromise, gearboxPromise, bottlePromise]);
        } catch (errs) {
            console.error(errs);
            return false;
        }

        runner.startAnimation('animation:0');
        gearbox.transform.position.set(16, 0, 0);
        gearbox.transform.scale.set(.1, .1, .1);
        const bottle = await MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: bottleAsset.prefabs.byIndex(0).id
        });

        await delay(10000);
        destroyActors([runner, gearbox, bottle]);

        return true;
    }
}
