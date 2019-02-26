/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, ColliderGeometry } from '.';

/**
 * Describes the properties of a collider.
 */
export interface ColliderLike {
    enabled: boolean;
    isTrigger: boolean;
    // collisionLayer: CollisionLayer;
    colliderGeometry: ColliderGeometry;
}

/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
export class Collider implements ColliderLike {
    public enabled = true;
    public isTrigger = false;
    // public collisionLayer = CollisionLayer.Object;

    // Readonly params that are not patchable or observable.
    // tslint:disable-next-line:variable-name
    private _colliderGeometry: Readonly<ColliderGeometry>;

    /**
     * The collider geometry that the collider was initialized with.  These are a
     * readonly structure and are not able to be updated after creation.
     */
    public get colliderGeometry() { return this._colliderGeometry; }

    /**
     * @hidden
     * Creates a new Collider instance.
     * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
     * @param initFrom The collider like to use to init from.
     * the actor patch detection system.
     */
    constructor(private $owner: Actor, initFrom: Partial<ColliderLike>) {
        if (initFrom) {
            if (!initFrom.colliderGeometry && !initFrom.colliderGeometry.colliderType) {
                throw new Error("Must provide valid collider params containing a valid collider type");
            }

            if (initFrom.colliderGeometry !== undefined) this._colliderGeometry = initFrom.colliderGeometry;
            if (initFrom.enabled !== undefined) this.enabled = initFrom.enabled;
            if (initFrom.isTrigger !== undefined) this.isTrigger = initFrom.isTrigger;
            // if (initFrom.collisionLayer !== undefined) this.collisionLayer = initFrom.collisionLayer;
        } else {
            throw new Error("Must provide a valid collider like to init from.");
        }
    }

    /** @hidden */
    public toJSON() {
        return {
            enabled: this.enabled,
            isTrigger: this.isTrigger,
            // collisionLayer: this.collisionLayer,
            colliderGeometry: this._colliderGeometry
        } as ColliderLike;
    }
}
