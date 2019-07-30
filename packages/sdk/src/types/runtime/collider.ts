/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, ColliderGeometry } from '.';
import { InternalCollider } from '../internal/collider';
import { CollisionHandler, TriggerHandler } from './physics';
import { ColliderEventType, CollisionEventType, TriggerEventType } from './physics/collisionEventType';

/**
 * Describes the properties of a collider.
 */
export interface ColliderLike {
	enabled: boolean;
	isTrigger: boolean;
	// collisionLayer: CollisionLayer;
	geometry: ColliderGeometry;
	eventSubscriptions: ColliderEventType[];
}

/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
export class Collider implements ColliderLike {
	public $DoNotObserve = ['_internal'];

	// Readonly params that are not patchable or observable.
	// tslint:disable:variable-name
	private _geometry: Readonly<ColliderGeometry>;
	private _internal: InternalCollider;
	// tslint:enable:variable-name

	public enabled = true;
	public isTrigger = false;
	// public collisionLayer = CollisionLayer.Object;

	/** @hidden */
	public get internal() { return this._internal; }

	/**
	 * The current event subscriptions that are active on this collider.
	 */
	public get eventSubscriptions(): ColliderEventType[] {
		return this.internal.eventSubscriptions;
	}

	/**
	 * The collider geometry that the collider was initialized with.  These are a
	 * readonly structure and are not able to be updated after creation.
	 */
	public get geometry() { return this._geometry; }

	/**
	 * @hidden
	 * Creates a new Collider instance.
	 * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
	 * @param initFrom The collider like to use to init from.
	 * the actor patch detection system.
	 */
	constructor(private $owner: Actor, initFrom: Partial<ColliderLike>) {
		if (initFrom) {
			if (!initFrom.geometry && !initFrom.geometry.shape) {
				throw new Error("Must provide valid collider params containing a valid collider type");
			}

			this._internal = new InternalCollider(this, $owner);

			if (initFrom.geometry !== undefined) this._geometry = initFrom.geometry;
			if (initFrom.enabled !== undefined) this.enabled = initFrom.enabled;
			if (initFrom.isTrigger !== undefined) this.isTrigger = initFrom.isTrigger;
			// if (initFrom.collisionLayer !== undefined) this.collisionLayer = initFrom.collisionLayer;
		} else {
			throw new Error("Must provide a valid collider like to init from.");
		}
	}

	/**
	 * Add a collision event handler for the given collision event state.
	 * @param eventType The type of the collision event.
	 * @param handler The handler to call when a collision event with the matching
	 * collision event state is received.
	 */
	public onCollision(eventType: CollisionEventType, handler: CollisionHandler) {
		this.internal.on(eventType, handler);
	}

	/**
	 * Remove the collision handler for the given collision event state.
	 * @param eventType The type of the collision event.
	 * @param handler The handler to remove.
	 */
	public offCollision(eventType: CollisionEventType, handler: CollisionHandler) {
		this.internal.off(eventType, handler);
	}

	/**
	 * Add a trigger event handler for the given collision event state.
	 * @param eventType The type of the trigger event.
	 * @param handler The handler to call when a trigger event with the matching
	 * collision event state is received.
	 */
	public onTrigger(eventType: TriggerEventType, handler: TriggerHandler) {
		this.internal.on(eventType, handler);
	}

	/**
	 * Remove the trigger handler for the given collision event state.
	 * @param eventType The type of the trigger event.
	 * @param handler The handler to remove.
	 */
	public offTrigger(eventType: TriggerEventType, handler: TriggerHandler) {
		this.internal.off(eventType, handler);
	}

	/** @hidden */
	public toJSON() {
		return {
			enabled: this.enabled,
			isTrigger: this.isTrigger,
			// collisionLayer: this.collisionLayer,
			geometry: this._geometry,
			eventSubscriptions: this.eventSubscriptions
		} as ColliderLike;
	}
}
