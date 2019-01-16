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

export default class AssetPreloadTest extends Test {

    constructor(app: App, private baseUrl: string, private user: MRESDK.User) {
        super(app);
    }

    public async run(): Promise<boolean> {
        const label = await MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    contents: 'Initialized',
                    height: 0.3,
                    anchor: MRESDK.TextAnchorLocation.BottomCenter
                }
            }
        });
        label.lookAt(this.user, MRESDK.LookAtMode.TargetXY);

        await delay(1000);

        label.text.contents = 'Preloading assets';
        const [prefabs, mats] = await Promise.all([
            this.app.context.assets.loadGltf('monkey', this.baseUrl + '/monkey.glb'),
            this.app.context.assets.loadGltf('uvgrid', this.generateMaterial())
        ]);
        label.text.contents = `Assets preloaded:
${prefabs.prefabs.count + mats.prefabs.count} prefabs, ${prefabs.materials.count + mats.materials.count} materials`;
        await delay(1000);

        label.text.contents = 'Instantiating prefabs';
        const head = await MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: prefabs.prefabs.byIndex(0).id,
            actor: {
                transform: {
                    position: { x: -1, y: 1, z: 0 }
                }
            }
        });
        const sphere = await MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: mats.materials.byIndex(0).id,
                transform: {
                    position: { x: 1, y: 1, z: 0 }
                }
            }
        });
        label.text.contents = 'Prefab instantiated';

        await delay(3000);

        function assignMat(actor: MRESDK.Actor, mat: MRESDK.Material) {
            actor.material = mat;
            actor.children.forEach(c => assignMat(c, mat));
        }

        assignMat(head, mats.materials.byIndex(0));
        assignMat(sphere, prefabs.materials.byIndex(0));
        label.text.contents = 'Materials swapped';

        await delay(3000);

        assignMat(head, null);
        assignMat(sphere, null);
        label.text.contents = 'Materials cleared';

        await delay(3000);

        destroyActors([head, sphere, label]);
        return true;
    }

    private generateMaterial(): string {
        const material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

        return Server.registerStaticBuffer('uvgrid', gltfFactory.generateGLTF());
    }
}
