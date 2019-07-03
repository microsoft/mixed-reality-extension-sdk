/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset } from '.';

export default class AssetCollection<T extends Asset> {
	private collection: { [k: string]: T } = {};
	// tslint:disable-next-line:variable-name
	private _count = 0;

	public get count() { return this._count; }

	public byIndex(index: number): T {
		return this.collection[index];
	}

	public byName(name: string): T {
		return this.collection[name];
	}

	public push(asset: T): void {
		if (asset.name) {
			this.collection[asset.name] = asset;
		}
		this.collection[this._count++] = asset;
	}
}
