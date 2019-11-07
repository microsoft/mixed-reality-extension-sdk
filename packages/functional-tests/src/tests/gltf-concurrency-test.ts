/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class GltfConcurrencyTest extends Test {
	public expectedResultDescription = "Cesium man, a bottle, and maybe a gearbox.";
	protected modsOnly = true;
	private assets: MRE.AssetContainer;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		let runnerAssets: MRE.Asset[];
		let bottleAssets: MRE.Asset[];
		let gearboxAssets: MRE.Asset[];

		this.assets.loadGltf('https://raw.githubusercontent.com/' +
			'KhronosGroup/glTF-Sample-Models/master/2.0/GearboxAssy/glTF/GearboxAssy.gltf')
		.then(assets => gearboxAssets = assets)
		.catch(() => console.log('Gearbox didn\'t load, as expected in Altspace'));

		try {
			[runnerAssets, bottleAssets] = await Promise.all([
				this.assets.loadGltf('https://raw.githubusercontent.com/' +
					'KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb'),
				this.assets.loadGltf('https://raw.githubusercontent.com/' +
					'KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF/WaterBottle.gltf')
			]);
		} catch (errs) {
			console.error(errs);
			return false;
		}

		const runner = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: runnerAssets.find(a => !!a.prefab).id,
			actor: {
				name: 'runner',
				parentId: root.id,
				transform: { local: { position: { x: 0.66, y: 0.0, z: -0.5 } } }
			}
		});
		runner.enableAnimation('animation:0');

		if (gearboxAssets) {
			MRE.Actor.CreateFromPrefab(this.app.context, {
				prefabId: gearboxAssets.find(a => !!a.prefab).id,
				actor: {
					name: 'gearbox',
					parentId: root.id,
					transform: { local: { position: { x: 16, y: 0.3, z: -1.5 }, scale: { x: 0.1, y: 0.1, z: 0.1 } } }
				}
			});
		}

		MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: bottleAssets.find(a => !!a.prefab).id,
			actor: {
				name: 'bottle',
				parentId: root.id,
				transform: { local: { position: { x: -.66, y: 0.5, z: -1 }, scale: { x: 4, y: 4, z: 4 } } }
			}
		});

		await this.stoppedAsync();
		return true;
	}

	public cleanup() {
		this.assets.unload();
	}
}
