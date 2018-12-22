/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class AssetPreloadTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        const label = await MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                lookAt: MRESDK.LookAtMode.LocalUserXY,
                text: {
                    contents: 'Initialized',
                    height: 0.3,
                    anchor: MRESDK.TextAnchorLocation.BottomCenter
                }
            }
        });
        await delay(1000);

        label.text.contents = 'Preloading asset';
        const group = await this.app.context.assets.loadGltf('monkey', this.baseUrl + '/monkey.glb');
        label.text.contents = 'Asset preloaded';
        await delay(1000);

        label.text.contents = 'Instantiating prefab';
        const actor = await MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: group.prefabs.byIndex(0).id,
            actor: {
                transform: {
                    position: { x: 0, y: 1, z: 0 }
                }
            }
        });
        label.text.contents = 'Prefab instantiated';

        await delay(3 * 1000);

        destroyActors([actor, label]);
        return true;
    }
}
