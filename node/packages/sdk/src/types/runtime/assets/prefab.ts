/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';

export interface PrefabLike {
    /** The number of actors this prefab contains. */
    actorCount: number;
}

export class Prefab extends Asset implements PrefabLike {
    // tslint:disable:variable-name
    private _actorCount: number;
    // tslint:enable:variable-name

    /** @inheritdoc */
    public get actorCount() { return this._actorCount; }

    /** @inheritdoc */
    public get prefab(): PrefabLike { return this; }

    public constructor(manager: AssetManager, def: AssetLike) {
        super(manager, def);

        if (!def.prefab) {
            throw new Error("Cannot construct prefab from non-prefab definition");
        }

        this._actorCount = def.prefab.actorCount;
    }

    /** @hidden */
    public toJSON(): AssetLike {
        return {
            ...super.toJSON(),
            prefab: {
                actorCount: this._actorCount
            }
        };
    }
}
