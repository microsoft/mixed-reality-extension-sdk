/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike } from '../..';
import { InternalPatchable } from '../patchable';

/**
 * @hidden
 */
export class InternalAsset implements InternalPatchable<AssetLike> {
	public observing = true;
	public patch: AssetLike;

	public constructor(public asset: Asset) { }

	public getPatchAndReset(): AssetLike {
		const patch = this.patch;
		if (patch) {
			patch.id = this.asset.id;
			delete this.patch;
		}
		return patch;
	}
}
