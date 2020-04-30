/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	ColliderEventType,
	ColliderGeometry,
	CollisionEventType,
	CollisionHandler,
	TriggerEventType,
	TriggerHandler
} from '../..';
import { ColliderInternal } from './colliderInternal';
import { float } from '@microsoft/mixed-reality-extension-common/src/math/types';

/**
 * Controls what the assigned actors will collide with.
 */
export enum CollisionLayer {
	/**
	 * Good for most actors. These will collide with all "physical" things: other default actors,
	 * navigation actors, and the non-MRE environment. It also blocks the UI cursor and receives press/grab events.
	 */
	Default = 'default',
	/**
	 * For actors considered part of the environment. Can move/teleport onto these colliders,
	 * but cannot click or grab them. For example, the floor, an invisible wall, or an elevator platform.
	 */
	Navigation = 'navigation',
	/**
	 * For "non-physical" actors. Only interact with the cursor (with press/grab events) and other holograms.
	 * For example, if you wanted a group of actors to behave as a separate physics simulation
	 * from the main scene.
	 */
	Hologram = 'hologram',
	/**
	 * Actors in this layer do not collide with anything but the UI cursor.
	 */
	UI = 'ui'
}

/**
 * Describes the properties of a collider.
 */
export interface ColliderLike {
	enabled: boolean;
	isTrigger: boolean;
	bounciness: float;
	staticFriction: float;
	dynamicFriction: float;
	layer: CollisionLayer;
	geometry: ColliderGeometry;
	eventSubscriptions: ColliderEventType[];
}

/**
 * A collider represents the abstraction of a physics collider object on the host.
 */
export class Collider implements ColliderLike {
	/** @hidden */
	public $DoNotObserve = ['_internal'];

	private _internal: ColliderInternal;

	public enabled = true;
	public isTrigger = false;
	public bounciness = 0.0;
	public staticFriction = 0.0;
	public dynamicFriction = 0.0;
	public layer = CollisionLayer.Default;
	public geometry: Readonly<ColliderGeometry>;

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

			this._internal = new ColliderInternal(this, $owner);
			if (from.geometry !== undefined) { this.geometry = from.geometry; }
			if (from.enabled !== undefined) { this.enabled = from.enabled; }
			if (from.isTrigger !== undefined) { this.isTrigger = from.isTrigger; }
			if (from.bounciness !== undefined) { this.bounciness = from.bounciness; }
			if (from.staticFriction !== undefined) { this.staticFriction = from.staticFriction; }
			if (from.dynamicFriction !== undefined) { this.dynamicFriction = from.dynamicFriction; }
			if (from.layer !== undefined) { this.layer = from.layer; }

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
			bounciness: this.bounciness,
			staticFriction: this.staticFriction,
			dynamicFriction: this.dynamicFriction,
			layer: this.layer,
			geometry: this.geometry,
			eventSubscriptions: this.eventSubscriptions
		} as ColliderLike;
	}
}
