/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class MutableAssetTest extends Test {

    constructor(app: App, private baseUrl: string, private user: MRESDK.User) {
        super(app);
    }

    public async run(): Promise<boolean> {

        const assets = await this.app.context.assetManager.loadGltf(
            'assets', `${this.baseUrl}/monkey.glb`);

        const monkey = MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: assets.prefabs.byIndex(0).id,
            actor: {
                name: 'monkey',
                transform: {
                    position: { x: 0, y: 1, z: 0 }
                }
            }
        }).value;

        const label = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: 'Original (pink)'
                }
            }
        }).value;
        label.lookAt(this.user, MRESDK.LookAtMode.TargetY);

        await delay(3000);

        const material = assets.materials.byIndex(0);
        const origColor = material.color.clone();
        material.color.set(0, 1, 0, 1);
        label.text.contents = 'Green';

        await delay(3000);

        material.color.copyFrom(origColor);
        label.text.contents = 'Back to original';

        await delay(3000);

        destroyActors([monkey, label]);
        return true;
    }
}
