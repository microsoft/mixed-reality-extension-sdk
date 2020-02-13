/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Guid, Vector3 } from "../..";

/**
 * The collision handler to be called when a collision event occurs.
 * @param data The collision data associated with the collision.
 */
export type CollisionHandler = (data: CollisionData) => void;

/**
 * The trigger handler to be called whan an actor has entered or exited
 * a trigger volume.
 * @param otherActor The other actor that has entered the trigger volume.
 */
export type TriggerHandler = (otherActor: Actor) => void;

/**
 * The collision state for the collsion event.
 */
export type CollisionEventState = 'enter' | 'exit';

/**
 * The point of contact for a collision.
 */
export interface ContactPoint {
	normal: Vector3;
	point: Vector3;
	separation: number;
}

/**
 * The collision data collected when a collision occurs.
 */
export interface CollisionData {
	otherActorId: Guid;
	otherActor?: Actor;
	contacts: ContactPoint[];
	impulse: Vector3;
	relativeVelocity: Vector3;
}

/**
 * The layer that the collider should be assigned to.
 */
// export enum CollisionLayer {
//     Object = 'object',
//     Environment = 'environment',
//     Hologram = 'hologram'
// }
