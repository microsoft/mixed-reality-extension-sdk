/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, ColliderParams, CollisionLayer } from '.';

/**
 * Describes the properties of a collider.
 */
export interface ColliderLike {
    enabled: boolean;
    isTrigger: boolean;
    collisionLayer: CollisionLayer;
    colliderParams: ColliderParams;
}

/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
export class Collider implements ColliderLike {
    public enabled: Readonly<boolean>;
    public isTrigger: boolean;
    public collisionLayer: CollisionLayer;

    // Readonly params that are not patchable or observable.
    // tslint:disable-next-line:variable-name
    private _colliderParams: Readonly<ColliderParams>;

    public get colliderParams() { return this._colliderParams; }

    // tslint:disable-next-line:variable-name
    constructor(private _owner: Actor) { }

    public copy(from: Partial<ColliderLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.isTrigger !== undefined) this.isTrigger = from.isTrigger;
        if (from.collisionLayer !== undefined) this.collisionLayer = from.collisionLayer;
        if (from.colliderParams !== undefined) this._colliderParams = from.colliderParams;
        return this;
    }

    public toJSON() {
        return {
            enabled: this.enabled,
            isTrigger: this.isTrigger,
            collisionLayer: this.collisionLayer,
            colliderParams: this.colliderParams
        };
    }
}
