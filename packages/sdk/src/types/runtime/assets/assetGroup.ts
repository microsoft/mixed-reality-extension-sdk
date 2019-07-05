/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetCollection, AssetIterator, AssetSource, Material, Mesh, Prefab, Sound, Texture } from '.';

export class AssetGroup implements Iterable<Asset> {
	public get source() { return this._source; }

	public prefabs = new AssetCollection<Prefab>();
	public meshes = new AssetCollection<Mesh>();
	public materials = new AssetCollection<Material>();
	public textures = new AssetCollection<Texture>();
	public sounds = new AssetCollection<Sound>();

	// tslint:disable-next-line:variable-name
	public constructor(public name: string, private _source: AssetSource) { }

	public add(asset: Asset): void {
		if (asset instanceof Prefab) {
			this.prefabs.push(asset);
		} else if (asset instanceof Mesh) {
			this.meshes.push(asset);
		} else if (asset instanceof Material) {
			this.materials.push(asset);
		} else if (asset instanceof Sound) {
			this.sounds.push(asset);
		} else if (asset instanceof Texture) {
			this.textures.push(asset);
		}
	}

	/** @hidden */
	public [Symbol.iterator] = () => new AssetIterator<Asset>([
		...this.prefabs,
		...this.meshes,
		...this.materials,
		...this.textures,
		...this.sounds
	]);
}
