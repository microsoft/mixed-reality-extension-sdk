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
	private assets: MRE.AssetContainer;
	private state = 0;

	private root: MRE.Actor;
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

	public async run(root: MRE.Actor): Promise<boolean> {
		this.root = root;
		this.assets = new MRE.AssetContainer(this.app.context);
		this.app.setOverrideText("Preloading assets");
		const [monkey, uvgrid] = await Promise.all([
			this.assets.loadGltf('monkey.glb', 'box'),
			this.assets.loadGltf(this.generateMaterial())
		]);
		this.app.setOverrideText("Assets preloaded:" +
			`${this.assets.prefabs.length} prefabs, ` +
			`${this.assets.materials.length} materials, ` +
			`${this.assets.textures.length} textures`);
		await delay(1000);

		this.monkeyPrefab = monkey.find(a => a.prefab !== null).prefab;
		this.monkeyMat = monkey.find(a => a.material !== null).material;
		this.uvgridMat = uvgrid.find(a => a.material !== null).material;
		this.uvgridTex = uvgrid.find(a => a.texture !== null).texture;

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
				this.setup();
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

	private setup() {
		this.uvgridMat.mainTexture = this.uvgridTex;
		this.head = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: this.monkeyPrefab.id,
			actor: {
				parentId: this.root.id,
				transform: {
					local: {
						position: { x: -0.5, y: 1, z: -1 },
						scale: { x: 0.5, y: 0.5, z: 0.5 }
					}
				}
			}
		});
		this.sphere = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: this.root.id,
				appearance: {
					meshId: this.assets.createSphereMesh('sphere', 0.5).id,
					materialId: this.uvgridMat.id
				},
				transform: {
					local: {
						position: { x: 0.5, y: 1, z: -1 }
					}
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		this.head.setBehavior(MRE.ButtonBehavior)
			.onButton("pressed", () => this.cycleState());
		this.sphere.setBehavior(MRE.ButtonBehavior)
			.onButton("pressed", () => this.cycleState());
	}

	private generateMaterial(): string {
		const material = new GltfGen.Material({
			baseColorTexture: new GltfGen.Texture({
				source: new GltfGen.Image({
					uri: 'uv-grid.png' // alternate form (don't embed)
				})
			})
		});
		const gltfFactory = new GltfGen.GltfFactory(null, null, [material]);

		return Server.registerStaticBuffer('uvgrid', gltfFactory.generateGLTF());
	}

	public cleanup() {
		this.assets.unload();
	}
}
