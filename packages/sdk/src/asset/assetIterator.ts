/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable max-classes-per-file */

import { Asset, AssetContainer } from '.';

/** @hidden */
export class AssetContainerIterator implements Iterator<Asset> {
	private containerIndex = 0;
	private assetIndex = 0;
	private get container() { return this.containers[this.containerIndex]; }
	private get asset() { return this.container && this.container.assets[this.assetIndex]; }

	public constructor(private containers: AssetContainer[]) {}
	public next(): IteratorResult<Asset> {
		if (!this.asset) {
			this.containerIndex += 1;
			this.assetIndex = 0;
		}
		if (!this.asset) {
			return { done: true, value: null };
		}

		const asset = this.asset;
		this.assetIndex += 1;
		return {
			done: false,
			value: asset
		};
	}
}

/** @hidden */
export class AssetContainerIterable implements Iterable<Asset> {
	public constructor(private containers: AssetContainer[]) {}
	public [Symbol.iterator] = () => new AssetContainerIterator(this.containers);
}
