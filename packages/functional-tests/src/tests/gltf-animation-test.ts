/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfAnimationTest extends Test {
	public expectedResultDescription = "Click to toggle walk animation";

	private assets: MRE.AssetContainer;
	private animating = false;
	private rawGltf: MRE.Actor;
	private prefab: MRE.Actor;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.rawGltf = MRE.Actor.CreateFromGltf(this.app.context, {
			resourceUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models' +
				'/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
			colliderType: 'box',
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: -1, z: -1 }
					}
				}
			}
		});

		this.rawGltf.setBehavior(MRE.ButtonBehavior)
			.onClick(() => this.setAnimationState(this.animating = !this.animating));

		this.prefab = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId:
				(await this.assets.loadGltf('https://raw.githubusercontent.com/KhronosGroup/' +
					'glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb', 'box')
				)
				.find(a => !!a.prefab).id,
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: 1, z: -1 }
					}
				}
			}
		});

		this.prefab.setBehavior(MRE.ButtonBehavior)
			.onClick(() => this.setAnimationState(this.animating = !this.animating));

		await this.stoppedAsync();
		return true;
	}

	private setAnimationState(play: boolean): void {
		if (play) {
			this.rawGltf.enableAnimation('animation:0');
			this.prefab.enableAnimation('animation:0');
		} else {
			this.rawGltf.disableAnimation('animation:0');
			this.prefab.disableAnimation('animation:0');
		}
	}
}
