/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetSource, Material, Mesh, Prefab, Texture } from '.';
import AssetCollection from './assetCollection';

export class AssetGroup {
	public get source() { return this._source; }

	public prefabs = new AssetCollection<Prefab>();
	public meshes = new AssetCollection<Mesh>();
	public materials = new AssetCollection<Material>();
	public textures = new AssetCollection<Texture>();

	// tslint:disable-next-line:variable-name
	public constructor(public name: string, private _source: AssetSource) { }

	public add(asset: Asset): void {
		if (asset instanceof Prefab) {
			this.prefabs.push(asset);
		} else if (asset instanceof Mesh) {
			this.meshes.push(asset);
		} else if (asset instanceof Material) {
			this.materials.push(asset);
		} else if (asset instanceof Texture) {
			this.textures.push(asset);
		}
	}
}
