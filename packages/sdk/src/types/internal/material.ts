/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AssetLike, Material, MaterialLike } from '../..';
import { InternalPatchable } from '../patchable';

/**
 * @hidden
 */
export class InternalMaterial implements InternalPatchable<AssetLike> {
    public observing = true;
    public patch: AssetLike;

    public constructor(public material: Material) { }

    public getPatchAndReset(): AssetLike {
        const patch = this.patch;
        if (patch) {
            patch.id = this.material.id;
            delete this.patch;
        }
        return patch;
    }
}
