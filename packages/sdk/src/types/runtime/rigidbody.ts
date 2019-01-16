/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, CollisionDetectionMode } from '.';
import { Quaternion, QuaternionLike, Vector3, Vector3Like } from '../..';
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
    position: Partial<Vector3Like>;
    rotation: QuaternionLike;
    velocity: Partial<Vector3Like>;
    angularVelocity: Partial<Vector3Like>;
    mass: number;
    detectCollisions: boolean;
    collisionDetectionMode: CollisionDetectionMode;
    useGravity: boolean;
    constraints: RigidBodyConstraints[];
}

export class RigidBody implements RigidBodyLike {
    // tslint:disable:variable-name
    private _position: Vector3;
    private _rotation: Quaternion;
    private _velocity: Vector3;
    private _angularVelocity: Vector3;
    private _constraints: RigidBodyConstraints[];
    // tslint:enable:variable-name

    public mass: number;
    public detectCollisions: boolean;
    public collisionDetectionMode: CollisionDetectionMode;
    public useGravity: boolean;

    /**
     * PUBLIC ACCESSORS
     */

    public get position() { return this._position; }
    public set position(value: Partial<Vector3>) { this._position.copy(value); }
    public get rotation() { return this._rotation; }
    public set rotation(value: Quaternion) { this._rotation.copy(value); }
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

    constructor(private owner: Actor) {
        this._position = Vector3.Zero();
        this._rotation = Quaternion.Identity();
        this._velocity = Vector3.Zero();
        this._angularVelocity = Vector3.Zero();
        this._constraints = [];
    }

    public copy(from: Partial<RigidBodyLike>): this {
        if (!from) return this;
        if (from.position !== undefined) this.position = from.position;
        if (from.rotation !== undefined) this._rotation.copy(from.rotation);
        if (from.velocity !== undefined) this.velocity = from.velocity;
        if (from.angularVelocity !== undefined) this.angularVelocity = from.angularVelocity;
        if (from.mass !== undefined) this.mass = from.mass;
        if (from.detectCollisions !== undefined) this.detectCollisions = from.detectCollisions;
        if (from.collisionDetectionMode !== undefined) this.collisionDetectionMode = from.collisionDetectionMode;
        if (from.useGravity !== undefined) this.useGravity = from.useGravity;
        if (from.constraints !== undefined) this.constraints = from.constraints;
        return this;
    }

    public toJSON() {
        return {
            position: this.position.toJSON(),
            rotation: this.rotation.toJSON(),
            velocity: this.velocity.toJSON(),
            angularVelocity: this.angularVelocity.toJSON(),
            mass: this.mass,
            detectCollisions: this.detectCollisions,
            collisionDetectionMode: this.collisionDetectionMode,
            useGravity: this.useGravity,
            constraints: this.constraints,
        } as RigidBodyLike;
    }

    public movePosition(position: Partial<Vector3Like>) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-move-position',
                position,
            } as RigidBodyMovePosition);
    }

    public moveRotation(rotation: QuaternionLike) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-move-rotation',
                rotation,
            } as RigidBodyMoveRotation);
    }

    public addForce(force: Partial<Vector3Like>) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-add-force',
                force,
            } as RigidBodyAddForce);
    }

    public addForceAtPosition(force: Partial<Vector3Like>, position: Partial<Vector3Like>) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-add-force-at-position',
                force,
                position,
            } as RigidBodyAddForceAtPosition);
    }

    public addTorque(torque: Partial<Vector3Like>) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-add-torque',
                torque,
            } as RigidBodyAddTorque);
    }

    public addRelativeTorque(relativeTorque: Partial<Vector3Like>) {
        this.owner.context.internal.sendRigidBodyCommand(
            this.owner.id,
            {
                type: 'rigidbody-add-relative-torque',
                relativeTorque,
            } as RigidBodyAddRelativeTorque);
    }
}
