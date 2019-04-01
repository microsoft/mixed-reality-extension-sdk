/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Server from '../server';
import { Test } from '../test';
import delay from '../utils/delay';

export default class AssetPreloadTest extends Test {
    public expectedResultDescription = "Two meshes juggle their materials and textures. Click to advance.";
    private state = 0;

    private head: MRE.Actor;
    private sphere: MRE.Actor;

    private monkeyPrefab: MRE.Prefab;
    private monkeyMat: MRE.Material;
    private uvgridMat: MRE.Material;
    private uvgridTex: MRE.Texture;

    private static AssignMat(actor: MRE.Actor, mat: MRE.Material) {
        actor.appearance.material = mat;
        actor.children.forEach(c => this.AssignMat(c, mat));
    }

    public async run(): Promise<boolean> {

        this.app.setOverrideText("Preloading assets");
        const [monkey, uvgrid] = await Promise.all([
            this.app.context.assetManager.loadGltf('monkey', this.baseUrl + '/monkey.glb', 'box'),
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
        this.uvgridMat.mainTexture = this.uvgridTex;
        this.head = await MRE.Actor.CreateFromPrefab(this.app.context, {
            prefabId: this.monkeyPrefab.id,
            actor: {
                transform: {
                    local: {
                        position: { x: -0.5, y: 1, z: -1 },
                        scale: { x: 0.5, y: 0.5, z: 0.5 }
                    }
                }
            }
        });
        this.sphere = await MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.5
            },
            addCollider: true,
            actor: {
                appearance: { materialId: this.uvgridMat.id },
                transform: {
                    local: {
                        position: { x: 0.5, y: 1, z: -1 }
                    }
                }
            }
        });

        this.head.setBehavior(MRE.ButtonBehavior)
            .onClick("pressed", () => this.cycleState());
        this.sphere.setBehavior(MRE.ButtonBehavior)
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
