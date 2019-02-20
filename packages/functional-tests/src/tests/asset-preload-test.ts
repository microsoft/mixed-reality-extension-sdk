/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import Server from '../server';
import { Test } from '../test';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';

export default class AssetPreloadTest extends Test {
    public expectedResultDescription = "Two meshes juggle their materials and textures. Click to advance.";
    private state = 0;

    private head: MRESDK.Actor;
    private sphere: MRESDK.Actor;

    private monkeyPrefab: MRESDK.Prefab;
    private monkeyMat: MRESDK.Material;
    private uvgridMat: MRESDK.Material;
    private uvgridTex: MRESDK.Texture;

    private static AssignMat(actor: MRESDK.Actor, mat: MRESDK.Material) {
        actor.material = mat;
        actor.children.forEach(c => this.AssignMat(c, mat));
    }

    public async run(): Promise<boolean> {

        this.app.setOverrideText("Preloading assets");
        const [monkey, uvgrid] = await Promise.all([
            this.app.context.assetManager.loadGltf('monkey', this.baseUrl + '/monkey.glb'),
            this.app.context.assetManager.loadGltf('uvgrid', this.generateMaterial())
        ]);
        this.app.setOverrideText("Assets preloaded:" +
            `${monkey.prefabs.count + uvgrid.prefabs.count} prefabs, ` +
            `${monkey.materials.count + uvgrid.materials.count} materials, ` +
            `${monkey.textures.count + uvgrid.textures.count} textures`);
        await delay(1000);

        this.monkeyPrefab = monkey.prefabs.byIndex(0);
        this.monkeyMat = monkey.materials.byIndex(0);
        this.uvgridMat = uvgrid.materials.byIndex(0);
        this.uvgridTex = uvgrid.textures.byIndex(0);

        await this.cycleState();
        await this.stoppedAsync();
        return true;
    }

    private async cycleState() {
        switch (this.state) {
            case 0:
                if (this.head) { this.head.destroy(); }
                if (this.sphere) { this.sphere.destroy(); }
                if (this.head || this.sphere) { await delay(1000); }

                this.app.setOverrideText("Instantiating prefabs");
                await this.setup();
                this.app.setOverrideText("Prefab instantiated");
                break;

            case 1:
                AssetPreloadTest.AssignMat(this.head, this.uvgridMat);
                AssetPreloadTest.AssignMat(this.sphere, this.monkeyMat);
                this.app.setOverrideText("Materials swapped");
                break;

            case 2:
                this.monkeyMat.mainTexture = this.uvgridTex;
                this.uvgridMat.mainTexture = null;
                this.app.setOverrideText("Textures swapped");
                break;

            case 3:
                this.monkeyMat.mainTexture = null;
                this.uvgridMat.mainTexture = null;
                this.app.setOverrideText("Textures cleared");
                break;

            case 4:
                AssetPreloadTest.AssignMat(this.head, null);
                AssetPreloadTest.AssignMat(this.sphere, null);
                this.app.setOverrideText("Materials cleared");
                break;
            default:
                throw new Error("How did we get here?");
        }
        this.state = (this.state + 1) % 5;
    }

    private async setup() {
        this.head = await MRESDK.Actor.CreateFromPrefab(this.app.context, {
            prefabId: this.monkeyPrefab.id,
            actor: {
                transform: {
                    position: { x: -1, y: 1, z: 0 }
                }
            }
        });
        this.sphere = await MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: this.uvgridMat.id,
                transform: {
                    position: { x: 1, y: 1, z: 0 }
                }
            }
        });

        this.head.setBehavior(MRESDK.ButtonBehavior)
            .onClick("pressed", () => this.cycleState());
        this.sphere.setBehavior(MRESDK.ButtonBehavior)
            .onClick("pressed", () => this.cycleState());
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
