/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset } from '.';

/** @hidden */
export class AssetIterator<T extends Asset> implements Iterator<T> {
	public constructor(private assets: T[]) {}
	public next(): IteratorResult<T> {
		return {
			done: this.assets.length === 0,
			value: this.assets.shift()
		}
	}
}