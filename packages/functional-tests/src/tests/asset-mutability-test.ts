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
import Test from './test';

export default class AssetMutabilityTest extends Test {

    constructor(app: App, private baseUrl: string, private user: MRESDK.User) {
        super(app);
    }

    public async run(): Promise<boolean> {

        const assets = await this.app.context.assetManager.loadGltf(
            'assets', this.generateMaterial()
        );

        const mat = assets.materials.byIndex(0);
        const box = await MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 1, y: 1, z: 1 }
            },
            actor: {
                name: 'box',
                materialId: mat.id,
                transform: {
                    position: { x: 0, y: 1, z: 0 }
                }
            }
        });

        for (let i = 0; i < 64; i++) {
            mat.color.copyFrom(this.fromHSV(i / 32, 1, 1));
            mat.mainTextureOffset.set(i / 32, i / 32);
            mat.mainTextureScale.set(1 - i / 32, 1 - i / 32);

            await delay(100);
        }

        destroyActors([box]);
        return true;
    }

    private generateMaterial(): string {
        const material = new GltfGen.Material({
            metallicFactor: 0,
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        return Server.registerStaticBuffer('assets.glb', gltfFactory.generateGLTF());
    }

    private fromHSV(h: number, s: number, v: number): MRESDK.Color4 {
        // from wikipedia: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
        function f(n: number, k = (n + h * 6) % 6) {
            return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        }
        return new MRESDK.Color4(f(5), f(3), f(1), 1);
    }
}
