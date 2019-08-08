/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfActorSyncTest extends Test {
	public expectedResultDescription = "Text should be visible";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const actorRoot = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: await this.assets.loadGltf(`${this.baseUrl}/monkey.glb`, 'box'),
			actor: {
				name: 'glTF',
				parentId: root.id,
				text: {
					contents: 'Peek-a-boo!',
					height: 0.1,
					anchor: MRE.TextAnchorLocation.BottomCenter
				},
				transform: {
					local: {
						position: { y: 1.5, z: -1 },
						scale: { x: 0.5, y: 0.5, z: 0.5 }
					}
				}
			}
		});
		await actorRoot.created();

		// move monkey head up
		const monkeyRoot = actorRoot.children[0];
		if (!monkeyRoot) {
			throw new Error('glTF node actor not found');
		}
		monkeyRoot.transform.local.position.y = -1;
		monkeyRoot.transform.local.rotation = MRE.Quaternion.FromEulerAngles(0, Math.PI, 0);

		await this.stoppedAsync();
		return true;
	}
}
