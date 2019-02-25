/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Vector3 } from "../../..";

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
    actorHit?: Actor;
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
