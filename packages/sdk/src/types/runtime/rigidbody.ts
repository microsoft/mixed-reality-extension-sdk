/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, CollisionDetectionMode } from '.';
import { QuaternionLike, Vector3, Vector3Like } from '../..';
import {
	RigidBodyAddForce,
	RigidBodyAddForceAtPosition,
	RigidBodyAddRelativeTorque,
	RigidBodyAddTorque,
	RigidBodyMovePosition,
	RigidBodyMoveRotation,
} from '../network/payloads';
import { RigidBodyConstraints } from '../rigidBodyConstraints';

/**
 * Describes the properties of a Rigid Body
 */
export interface RigidBodyLike {
	/** Whether the rigid body is enabled or not. */
	enabled: boolean;
	/** The velocity of the rigid body. */
	velocity: Partial<Vector3Like>;
	/** The angular velocity of the rigid body. */
	angularVelocity: Partial<Vector3Like>;
	/** The mass of the rigid body. */
	mass: number;
	/** Whether to detect collisions with this rigid body. */
	detectCollisions: boolean;
	/** The collision detection mode to use with this rigid body.  @see CollisionDetectionMode for options. */
	collisionDetectionMode: CollisionDetectionMode;
	/** Whether the rigid body is affected by gravity. */
	useGravity: boolean;
	/**
	 * Whether the rigid body is kinematic.  Note kinematic rigid bodies participate in collisions,
	 * but are not simulated by the rigid body.  This is useful for objects that should collide with
	 * other objects, but you want to control the position/rotation manually or animate them.
	 */
	isKinematic: boolean;
	/** The constraints that the rigid body is bound by.  @see RigidBodyConstraints for options. */
	constraints: RigidBodyConstraints[];
}

/**
 * Class that represents a rigid body found on an actor.
 */
export class RigidBody implements RigidBodyLike {
	private _velocity: Vector3;
	private _angularVelocity: Vector3;
	private _constraints: RigidBodyConstraints[];

	/** @inheritdoc */
	public enabled = true;

	/** @inheritdoc */
	public mass = 1.0;

	/** @inheritdoc */
	public detectCollisions = true;

	/** @inheritdoc */
	public collisionDetectionMode = CollisionDetectionMode.Discrete;

	/** @inheritdoc */
	public useGravity = true;

	/** @inheritdoc */
	public isKinematic = false;

	/**
	 * PUBLIC ACCESSORS
	 */

	/** @inheritdoc */
	public get velocity() { return this._velocity; }
	public set velocity(value: Partial<Vector3>) { this._velocity.copy(value); }

	/** @inheritdoc */
	public get angularVelocity() { return this._angularVelocity; }
	public set angularVelocity(value: Partial<Vector3>) { this._angularVelocity.copy(value); }

	/** @inheritdoc */
	public get constraints() { return this._constraints; }
	public set constraints(value: RigidBodyConstraints[]) {
		this._constraints = [...value];
		// TODO: Figure out array patching
		// this._changed("constraints");
	}

	/**
	 * PUBLIC METHODS
	 */

	/**
	 * @hidden
	 * Creates a new RigidBody instance.
	 * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
	 * the actor patch detection system.
	 */
	constructor(private $owner: Actor) {
		this._velocity = Vector3.Zero();
		this._angularVelocity = Vector3.Zero();
		this._constraints = [];
	}

	/** @hidden */
	public copy(from: Partial<RigidBodyLike>): this {
		if (!from) { return this; }
		if (from.enabled !== undefined) { this.enabled = from.enabled; }
		if (from.velocity !== undefined) { this._velocity.copy(from.velocity); }
		if (from.angularVelocity !== undefined) { this._angularVelocity.copy(from.angularVelocity); }
		if (from.mass !== undefined) { this.mass = from.mass; }
		if (from.detectCollisions !== undefined) { this.detectCollisions = from.detectCollisions; }
		if (from.collisionDetectionMode !== undefined) { this.collisionDetectionMode = from.collisionDetectionMode; }
		if (from.useGravity !== undefined) { this.useGravity = from.useGravity; }
		if (from.isKinematic !== undefined) { this.isKinematic = from.isKinematic; }
		if (from.constraints !== undefined) { this.constraints = from.constraints; }
		return this;
	}

	/** @hidden */
	public toJSON() {
		return {
			enabled: this.enabled,
			velocity: this.velocity.toJSON(),
			angularVelocity: this.angularVelocity.toJSON(),
			mass: this.mass,
			detectCollisions: this.detectCollisions,
			collisionDetectionMode: this.collisionDetectionMode,
			useGravity: this.useGravity,
			isKinematic: this.isKinematic,
			constraints: this.constraints,
		} as RigidBodyLike;
	}

	/**
	 * Move the rigid body to the new position with interpolation where supported.
	 * @param position The position to move to.
	 */
	public movePosition(position: Partial<Vector3Like>) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-move-position',
				position,
			} as RigidBodyMovePosition);
	}

	/**
	 * Rotate the rigid body to the new rotation with interpolation where supported.
	 * @param rotation The new rotation to rotate to.
	 */
	public moveRotation(rotation: QuaternionLike) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-move-rotation',
				rotation,
			} as RigidBodyMoveRotation);
	}

	/**
	 * Apply a force to the rigid body for physics to simulate.
	 * @param force The force to apply to the rigid body.
	 */
	public addForce(force: Partial<Vector3Like>) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-add-force',
				force,
			} as RigidBodyAddForce);
	}

	/**
	 * Apply a force to the rigid body at a specific position for physics to simulate.
	 * @param force The force to apply to the rigid body.
	 * @param position The position at which to apply the force.  This should be in app coordinates.
	 */
	public addForceAtPosition(force: Partial<Vector3Like>, position: Partial<Vector3Like>) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-add-force-at-position',
				force,
				position,
			} as RigidBodyAddForceAtPosition);
	}

	/**
	 * Add a torque to the rigid body for physics to simulate.
	 * @param torque The torque to apply to the rigid body.
	 */
	public addTorque(torque: Partial<Vector3Like>) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-add-torque',
				torque,
			} as RigidBodyAddTorque);
	}

	/**
	 * Add a relative torque to the rigid body for physics to simulate.
	 * @param relativeTorque The relative torque to apply to the rigid body.
	 */
	public addRelativeTorque(relativeTorque: Partial<Vector3Like>) {
		this.$owner.context.internal.sendRigidBodyCommand(
			this.$owner.id,
			{
				type: 'rigidbody-add-relative-torque',
				relativeTorque,
			} as RigidBodyAddRelativeTorque);
	}
}
