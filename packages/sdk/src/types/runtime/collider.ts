/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, ColliderGeometry } from '.';
import { CollisionEventState, CollisionHandler } from './physics';

interface CollisionHandlers {
    'enter'?: CollisionHandler[];
    'exit'?: CollisionHandler[];
}

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
    // tslint:disable:variable-name
    private _colliderGeometry: Readonly<ColliderGeometry>;
    private _collisionHandlers: CollisionHandlers = {};
    private _triggerHandlers: CollisionHandlers = {};
    // tslint:enable:variable-name

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

    /**
     * Add a collision event handler for the given collision event state.
     * @param state The state of the collision event.
     * @param handler The handler to call when a collision event with the matching
     * collision event state is received.
     */
    public onCollision(state: CollisionEventState, handler: CollisionHandler) {
        if (!!this._collisionHandlers[state]) {
            this._collisionHandlers[state] = [];
        }

        this._collisionHandlers[state].push(handler);
    }

    /**
     * Remove the collision handler for the given collision event state.
     * @param state The state of the collision event.
     * @param handler The handler to remove.
     */
    public offCollision(state: CollisionEventState, handler: CollisionHandler) {
        if (this._collisionHandlers[state]) {
            this._collisionHandlers[state] =
                this._collisionHandlers[state].filter(h => h !== handler);
        }
    }

    /**
     * Add a trigger event handler for the given collision event state.
     * @param state The state of the trigger event.
     * @param handler The handler to call when a trigger event with the matching
     * collision event state is received.
     */
    public onTrigger(state: CollisionEventState, handler: CollisionHandler) {
        if (!!this._triggerHandlers[state]) {
            this._triggerHandlers[state] = [];
        }

        this._triggerHandlers[state].push(handler);
    }

    /**
     * Remove the trigger handler for the given collision event state.
     * @param state The state of the trigger event.
     * @param handler The handler to remove.
     */
    public offTrigger(state: CollisionEventState, handler: CollisionHandler) {
        if (this._triggerHandlers[state]) {
            this._triggerHandlers[state] =
                this._triggerHandlers[state].filter(h => h !== handler);
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
