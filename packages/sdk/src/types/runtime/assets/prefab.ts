/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface PrefabLike {
    /** The number of actors this prefab contains. */
    actorCount: number;
}

export class Prefab extends Asset implements PrefabLike, Patchable<AssetLike> {
    // tslint:disable:variable-name
    private _actorCount: number;
    private _internal = new InternalAsset(this);
    // tslint:enable:variable-name

    /** @hidden */
    public get internal() { return this._internal; }

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

    public copy(from: Partial<AssetLike>): this {
        if (!from) {
            return this;
        }

        // Pause change detection while we copy the values into the actor.
        const wasObserving = this.internal.observing;
        this.internal.observing = false;

        // tslint:disable:curly
        super.copy(from);
        if (from.prefab)
            this._actorCount = from.prefab.actorCount;
        // tslint:enable:curly

        this.internal.observing = wasObserving;
        return this;
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
