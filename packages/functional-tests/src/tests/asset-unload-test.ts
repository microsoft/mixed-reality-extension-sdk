/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class AssetUnloadTest extends Test {
	public expectedResultDescription = "Unload assets one at a time";
	private assetContainer1: MRE.AssetContainer;
	private assetContainer2: MRE.AssetContainer;
	private prim: MRE.Actor;
	private state = 0;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.prim = MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Sphere,
				radius: 0.5
			},
			addCollider: true,
			actor: {
				name: 'sphere',
				parentId: root.id,
				transform: {
					local: {
						position: { y: 1, z: -1 }
					}
				}
			}
		});
		this.setup();

		this.prim.setBehavior(MRE.ButtonBehavior).onClick(() => this.cycleState());

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		if (this.assetContainer1) {
			this.assetContainer1.unload();
		}
		if (this.assetContainer2) {
			this.assetContainer2.unload();
		}
	}

	private setup() {
		this.assetContainer1 = new MRE.AssetContainer(this.app.context);
		this.assetContainer2 = new MRE.AssetContainer(this.app.context);
		this.app.setOverrideText("Colored & textured sphere");

		const tex = this.assetContainer1.createTexture('uvgrid', {
			uri: `${this.baseUrl}/uv-grid.png`
		});

		const mat = this.assetContainer2.createMaterial('blue', {
			color: MRE.Color3.Blue(),
			mainTextureId: tex.id
		});

		this.prim.appearance.material = mat;
	}

	private cycleState() {
		switch (++this.state % 3) {
			case 0:
				this.setup();
				break;
			case 1:
				this.assetContainer1.unload();
				this.assetContainer1 = null;
				this.app.setOverrideText("Colored sphere");
				break;
			case 2:
				this.assetContainer2.unload();
				this.assetContainer2 = null;
				this.app.setOverrideText("Plain sphere");
				break;
			default:
				throw new Error("How did we get here?");
		}
	}
}
