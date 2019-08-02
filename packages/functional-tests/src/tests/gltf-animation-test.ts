/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfAnimationTest extends Test {
	public expectedResultDescription = "Cesium Man walking";
	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const tester = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: this.assets.loadGltf('https://raw.githubusercontent.com/' +
				'KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb'
			),
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { y: 0.0, z: -1 }
					}
				}
			}
		});
		tester.enableAnimation('animation:0');
		this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "start animation");

		await this.stoppedAsync();

		tester.disableAnimation('animation:0');
		this.app.rpc.send('functional-test:trace-message', 'gltf-animation-test', "stop animation");

		return true;
	}
}
