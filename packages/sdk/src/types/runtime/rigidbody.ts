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

export interface RigidBodyLike {
    enabled: boolean;
    velocity: Partial<Vector3Like>;
    angularVelocity: Partial<Vector3Like>;
    mass: number;
    detectCollisions: boolean;
    collisionDetectionMode: CollisionDetectionMode;
    useGravity: boolean;
    isKinematic: boolean;
    constraints: RigidBodyConstraints[];
}

export class RigidBody implements RigidBodyLike {
    // tslint:disable:variable-name
    private _velocity: Vector3;
    private _angularVelocity: Vector3;
    private _constraints: RigidBodyConstraints[];
    // tslint:enable:variable-name

    public enabled = true;
    public mass = 1.0;
    public detectCollisions = true;
    public collisionDetectionMode = CollisionDetectionMode.Discrete;
    public useGravity = true;
    public isKinematic = false;

    /**
     * PUBLIC ACCESSORS
     */

    public get velocity() { return this._velocity; }
    public set velocity(value: Partial<Vector3>) { this._velocity.copy(value); }
    public get angularVelocity() { return this._angularVelocity; }
    public set angularVelocity(value: Partial<Vector3>) { this._angularVelocity.copy(value); }
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
     * Creates a new RigidBody instance.
     * @param $owner The owning actor instance. Field name is prefixed with a dollar sign so that it is ignored by
     * the actor patch detection system.
     */
    constructor(private $owner: Actor) {
        this._velocity = Vector3.Zero();
        this._angularVelocity = Vector3.Zero();
        this._constraints = [];
    }

    public copy(from: Partial<RigidBodyLike>): this {
        if (!from) return this;
        if (from.enabled !== undefined) this.enabled = from.enabled;
        if (from.velocity !== undefined) this._velocity.copy(from.velocity);
        if (from.angularVelocity !== undefined) this._angularVelocity.copy(from.angularVelocity);
        if (from.mass !== undefined) this.mass = from.mass;
        if (from.detectCollisions !== undefined) this.detectCollisions = from.detectCollisions;
        if (from.collisionDetectionMode !== undefined) this.collisionDetectionMode = from.collisionDetectionMode;
        if (from.useGravity !== undefined) this.useGravity = from.useGravity;
        if (from.isKinematic !== undefined) this.isKinematic = from.isKinematic;
        if (from.constraints !== undefined) this.constraints = from.constraints;
        return this;
    }

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

    public movePosition(position: Partial<Vector3Like>) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-move-position',
                position,
            } as RigidBodyMovePosition);
    }

    public moveRotation(rotation: QuaternionLike) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-move-rotation',
                rotation,
            } as RigidBodyMoveRotation);
    }

    public addForce(force: Partial<Vector3Like>) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-add-force',
                force,
            } as RigidBodyAddForce);
    }

    public addForceAtPosition(force: Partial<Vector3Like>, position: Partial<Vector3Like>) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-add-force-at-position',
                force,
                position,
            } as RigidBodyAddForceAtPosition);
    }

    public addTorque(torque: Partial<Vector3Like>) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-add-torque',
                torque,
            } as RigidBodyAddTorque);
    }

    public addRelativeTorque(relativeTorque: Partial<Vector3Like>) {
        this.$owner.context.internal.sendRigidBodyCommand(
            this.$owner.id,
            {
                type: 'rigidbody-add-relative-torque',
                relativeTorque,
            } as RigidBodyAddRelativeTorque);
    }
}
