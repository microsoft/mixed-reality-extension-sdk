/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class AssetEarlyAssignmentTest extends Test {
	public expectedResultDescription = "Unlit colored & textured sphere";
	private assets: MRE.AssetContainer;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const tex = this.assets.createTexture('uvgrid', {
			uri: 'uv-grid.png'
		});

		const mat = this.assets.createMaterial('blue', {
			color: MRE.Color3.Black(),
			emissiveColor: MRE.Color3.Blue(),
			emissiveTextureId: tex.id
		});

		const mesh = this.assets.createSphereMesh('sphere', 0.5);

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'sphere',
				parentId: root.id,
				appearance: {
					meshId: mesh.id,
					materialId: mat.id
				},
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

	public cleanup() {
		this.assets.unload();
	}
}
