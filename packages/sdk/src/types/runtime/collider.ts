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

	// tslint:disable-next-line:variable-name
	private _internal: InternalCollider;

	public enabled = true;
	public isTrigger = false;
	public geometry: Readonly<ColliderGeometry>;
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
	 * @hidden
	 * Creates a new Collider instance.
	 * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
	 * the actor patch detection system.
	 * @param initFrom The collider like to use to init from.
	 */
	constructor(private $owner: Actor, from: Partial<ColliderLike>) {
		if (from) {
			if (!from.geometry || !from.geometry.shape) {
				throw new Error("Must provide valid collider params containing a valid shape");
			}

			this._internal = new InternalCollider(this, $owner);
			if (from.geometry !== undefined) this.geometry = from.geometry;
			if (from.enabled !== undefined) this.enabled = from.enabled;
			if (from.isTrigger !== undefined) this.isTrigger = from.isTrigger;
		} else {
			throw new Error("Must provide a valid collider-like to initialize from.");
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
			geometry: this.geometry,
			eventSubscriptions: this.eventSubscriptions
		} as ColliderLike;
	}
}
