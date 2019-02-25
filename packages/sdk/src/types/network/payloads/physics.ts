/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Payload } from '.';
import { CollisionData, QuaternionLike, Vector3Like } from '../../..';

/**
 * @hidden
 */
export enum CollisionEventType {
    CollisionEnter = 'collision-enter',
    CollisionExit = 'collision-exit',
    TriggerEnter = 'trigger-enter',
    TriggerExit = 'trigger-exit'
}

/**
 * @hidden
 * App to engine.  Send a rigidbody command
 */
export type RigidBodyCommands = Payload & {
    type: 'rigidbody-commands';
    actorId: string;
    commandPayloads: Payload[];
};

/**
 * @hidden
 * App to engine. Move position of rigidbody
 */
export type RigidBodyMovePosition = Payload & {
    type: 'rigidbody-move-position';
    position: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Move rotation of rigidbody
 */
export type RigidBodyMoveRotation = Payload & {
    type: 'rigidbody-move-rotation';
    rotation: QuaternionLike;
};

/**
 * @hidden
 * App to engine. Add force rigidbody command
 */
export type RigidBodyAddForce = Payload & {
    type: 'rigidbody-add-force';
    force: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force at position rigidbody command
 */
export type RigidBodyAddForceAtPosition = Payload & {
    type: 'rigidbody-add-force-at-position';
    force: Partial<Vector3Like>;
    position: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force rigidbody command
 */
export type RigidBodyAddTorque = Payload & {
    type: 'rigidbody-add-torque';
    torque: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force at position rigidbody command
 */
export type RigidBodyAddRelativeTorque = Payload & {
    type: 'rigidbody-add-relative-torque';
    relativeTorque: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Update the collision event subscriptions for the given actor.
 */
export type UpdateCollisionEventSubscriptions = Payload & {
    type: 'update-collision-event-subscriptions';
    actorId: string;
    adds: CollisionEventType[];
    removes: CollisionEventType[];
};

/**
 * @hidden
 * Engine to app. Collision event data from engine after a collision has occured.
 */
export type CollisionEventRaised = Payload & {
    type: 'collision-event-raised';
    actorId: string;
    collisionEventType: CollisionEventType;
    collisionData: CollisionData;
};
