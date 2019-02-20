/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfConcurrencyTest extends Test {
    public expectedResultDescription = "Cesium man, a bottle, and maybe a gearbox.";

    public async run(): Promise<boolean> {
        const runnerPromise = MRESDK.Actor.CreateFromGltf(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`
        });

        const gearboxPromise = MRESDK.Actor.CreateFromGltf(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF/GearboxAssy.gltf',
            actor: {
                transform: {
                    position: { x: 15, y: 0, z: 0 },
                    scale: { x: 0.1, y: 0.1, z: 0.1 }
                }
            }
        });

        const bottlePromise = this.app.context.assetManager.loadGltf('bottle',
            // tslint:disable-next-line:max-line-length
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf');

        try {
            await gearboxPromise;
        } catch (e) {
            console.log('Gearbox didn\'t load, as expected in Altspace');
        }

        let runner: MRESDK.Actor;
        let bottleAsset: MRESDK.AssetGroup;
        try {
            [runner, bottleAsset] = await Promise.all([runnerPromise, bottlePromise]);
        } catch (errs) {
            console.error(errs);
            return false;
        }

        runner.enableAnimation('animation:0');
        await MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: bottleAsset.prefabs.byIndex(0).id
        });

        await this.stoppedAsync();
        return true;
    }
}
