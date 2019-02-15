/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import App from '../app';
import Server from '../server';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';

import Test from '../test';

export default class AssetEarlyAssignmentTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        const AM = this.app.context.assetManager;

        const label = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: 'Colored & textured sphere',
                    height: 0.3,
                    anchor: MRESDK.TextAnchorLocation.BottomCenter
                }
            }
        }).value;

        const tex = AM.createTexture('uvgrid', {
            uri: `${this.baseUrl}/uv-grid.png`
        }).value;

        const mat = AM.createMaterial('blue', {
            color: MRESDK.Color3.Blue(),
            mainTextureId: tex.id
        }).value;

        const sphere = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: mat.id,
                transform: {
                    position: { x: 0, y: 1, z: 0 }
                }
            }
        }).value;

        await delay(3000);

        destroyActors([sphere, label]);
        return true;
    }
}
