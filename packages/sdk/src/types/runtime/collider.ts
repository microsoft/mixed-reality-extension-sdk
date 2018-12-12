/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, ColliderParams, CollisionLayer } from ".";

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
    // tslint:disable:variable-name
    private _enabled: Readonly<boolean>;
    private _isTrigger: boolean;
    private _collisionLayer: CollisionLayer;
    // tslint:enable:variable-name

    // Readonly params that are not patchable or observable.
    private $colliderParams: Readonly<ColliderParams>;

    public get enabled() { return this._enabled; }
    public set enabled(value: boolean) { this._enabled = value; }

    public get isTrigger() { return this._isTrigger; }
    public set isTrigger(value: boolean) { this._isTrigger = value; }

    public get collisionLayer() { return this._collisionLayer; }
    public set collisionLayer(value: CollisionLayer) { this._collisionLayer = value; }

    public get colliderParams() { return this.$colliderParams; }

    constructor(private owner: Actor) {}

    public copyDirect(scollider: Partial<ColliderLike>): this {
        if (!scollider) {
            return this;
        }
        if (typeof scollider.enabled !== undefined) {
            this._enabled = scollider.enabled;
        }
        if (typeof scollider.isTrigger !== undefined) {
            this._isTrigger = scollider.isTrigger;
        }
        if (typeof scollider.collisionLayer !== undefined) {
            this._collisionLayer = scollider.collisionLayer;
        }
        if (typeof scollider.colliderParams !== undefined) {
            this.$colliderParams = scollider.colliderParams;
        }
        return this;
    }

    public toJSON() {
        return {
            enabled: this._enabled,
            isTrigger: this._isTrigger,
            collisionLayer: this._collisionLayer,
            colliderParams: this.$colliderParams
        } as ColliderLike;
    }
}
