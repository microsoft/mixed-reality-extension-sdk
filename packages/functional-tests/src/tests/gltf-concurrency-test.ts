/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfConcurrencyTest extends Test {
    public expectedResultDescription = "Cesium man, a bottle, and maybe a gearbox.";

    public async run(root: MRE.Actor): Promise<boolean> {
        const runnerPromise = MRE.Actor.CreateFromGltf(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb`,
            actor: {
                name: 'runner',
                parentId: root.id,
                transform: { local: { position: { x: 0.66, y: 0.0, z: -0.5 } } }
            }
        });
        const runner = runnerPromise.value;

        const gearboxPromise = MRE.Actor.CreateFromGltf(this.app.context, {
            // tslint:disable-next-line:max-line-length
            resourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF/GearboxAssy.gltf',
            actor: {
                name: 'gearbox',
                parentId: root.id,
                transform: { local: { position: { x: 16, y: 0.3, z: -1.5 }, scale: { x: 0.1, y: 0.1, z: 0.1 } } }
            }
        });

        const bottlePromise = this.app.context.assetManager.loadGltf('bottle',
            // tslint:disable-next-line:max-line-length
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf');

        runner.enableAnimation('animation:0');

        try {
            await gearboxPromise;
        } catch (e) {
            console.log('Gearbox didn\'t load, as expected in Altspace');
        }

        let runnerActor: MRE.Actor;
        let bottleAsset: MRE.AssetGroup;
        try {
            [runnerActor, bottleAsset] = await Promise.all([runnerPromise, bottlePromise]);
        } catch (errs) {
            console.error(errs);
            return false;
        }

        MRE.Actor.CreateFromPrefab(this.app.context, {
            prefabId: bottleAsset.prefabs.byIndex(0).id,
            actor: {
                name: 'bottle',
                parentId: root.id,
                transform: { local: { position: { x: -.66, y: 0.5, z: -1 }, scale: { x: 4, y: 4, z: 4 } } }
            }
        });

        await this.stoppedAsync();
        return true;
    }
}
