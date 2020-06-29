/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Payloads } from '../../internal';
import {
	CollisionData,
	CollisionEventType,
	Guid,
	TriggerEventType,
	QuaternionLike,
	Vector3Like
} from '../..';
import {
	PhysicsBridgeTransformUpdate
} from '../../actor/physics/physicsBridge';

/**
 * @hidden
 * App to engine.  Send a rigidbody command
 */
export type RigidBodyCommands = Payloads.Payload & {
	type: 'rigidbody-commands';
	actorId: Guid;
	commandPayloads: Payloads.Payload[];
};

/**
 * @hidden
 * App to engine. Move position of rigidbody
 */
export type RigidBodyMovePosition = Payloads.Payload & {
	type: 'rigidbody-move-position';
	position: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Move rotation of rigidbody
 */
export type RigidBodyMoveRotation = Payloads.Payload & {
	type: 'rigidbody-move-rotation';
	rotation: QuaternionLike;
};

/**
 * @hidden
 * App to engine. Add force rigidbody command
 */
export type RigidBodyAddForce = Payloads.Payload & {
	type: 'rigidbody-add-force';
	force: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force at position rigidbody command
 */
export type RigidBodyAddForceAtPosition = Payloads.Payload & {
	type: 'rigidbody-add-force-at-position';
	force: Partial<Vector3Like>;
	position: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force rigidbody command
 */
export type RigidBodyAddTorque = Payloads.Payload & {
	type: 'rigidbody-add-torque';
	torque: Partial<Vector3Like>;
};

/**
 * @hidden
 * App to engine. Add force at position rigidbody command
 */
export type RigidBodyAddRelativeTorque = Payloads.Payload & {
	type: 'rigidbody-add-relative-torque';
	relativeTorque: Partial<Vector3Like>;
};

/**
 * @hidden
 * Engine to app. Collision event data from engine after a collision has occured.
 */
export type CollisionEventRaised = Payloads.Payload & {
	type: 'collision-event-raised';
	actorId: Guid;
	eventType: CollisionEventType;
	collisionData: CollisionData;
};

/**
 * @hidden
 * Engine to app.  Trigger event data from engine after a trigger event has occured.
 */
export type TriggerEventRaised = Payloads.Payload & {
	type: 'trigger-event-rasied';
	actorId: Guid;
	eventType: TriggerEventType;
	otherActorId: Guid;
};

export type PhysicsBridgeUpdate = Payloads.Payload & {
	type: 'physicsbridge-transforms-update';
	transforms: Partial<PhysicsBridgeTransformUpdate>;
}
