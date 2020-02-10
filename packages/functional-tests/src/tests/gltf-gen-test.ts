/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolve } from 'path';

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Server from '../server';
import { Test } from '../test';

export default class GltfGenTest extends Test {
	public expectedResultDescription = "A textured sphere";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const mat = new GltfGen.Material({
			baseColorFactor: new MRE.Color4(1, 1, 1, 0.7),
			baseColorTexture: new GltfGen.Texture({
				source: new GltfGen.Image({
					embeddedFilePath: resolve(__dirname, '../../public/uv-grid.png')
					// uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
				})
			}),
			alphaMode: GltfGen.AlphaMode.Blend
		});

		const sphere = new GltfGen.Node({
			name: 'sphere',
			mesh: new GltfGen.Mesh({ name: 'sphere', primitives: [new GltfGen.Sphere(0.5, 36, 18, mat)] }),
			translation: new MRE.Vector3(1, 0, 0)
		});

		const box = new GltfGen.Node({
			name: 'box',
			mesh: new GltfGen.Mesh({ name: 'box', primitives: [new GltfGen.Box(0.9, 0.9, 0.9, mat)] }),
			translation: new MRE.Vector3(0, 0, 0)
		});

		const capsule = new GltfGen.Node({
			name: 'capsule',
			mesh: new GltfGen.Mesh({ name: 'capsule', primitives: [new GltfGen.Capsule(0.3, 1, 36, 18, 0.35, mat)] }),
			translation: new MRE.Vector3(-1, 0, 0)
		});

		const gltfFactory = new GltfGen.GltfFactory([new GltfGen.Scene({
			nodes: [sphere, box, capsule]
		})]);

		MRE.Actor.CreateFromGltf(this.assets, {
			uri: Server.registerStaticBuffer('test.glb', gltfFactory.generateGLTF()),
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { y: 1, z: -1 }
					}
				}
			}
		});

		await this.stoppedAsync();

		return true;
	}
}
