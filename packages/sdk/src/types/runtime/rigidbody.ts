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
    public position: Vector3;
    public rotation: Quaternion;
    public velocity: Vector3;
    public angularVelocity: Vector3;
    public mass: number;
    public detectCollisions: boolean;
    public collisionDetectionMode: CollisionDetectionMode;
    public useGravity: boolean;
    // tslint:disable-next-line:variable-name
    private _constraints: RigidBodyConstraints[] = [];

    /**
     * PUBLIC ACCESSORS
     */
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
        this.velocity = Vector3.Zero();
        this.angularVelocity = Vector3.Zero();
        this.position = Vector3.Zero();
        this.rotation = Quaternion.Identity();
    }

    public copy(from: Partial<RigidBodyLike>): this {
        if (!from) {
            return this;
        }
        if (from.position !== undefined) {
            if (!this.position) this.position = new Vector3();
            this.position.copy(from.position);
        }
        if (from.rotation !== undefined) {
            if (!this.rotation) this.rotation = new Quaternion();
            this.rotation.copy(from.rotation);
        }
        if (from.velocity !== undefined) {
            if (!this.velocity) this.velocity = new Vector3();
            this.velocity.copy(from.velocity);
        }
        if (from.angularVelocity !== undefined) {
            if (!this.angularVelocity) this.angularVelocity = new Vector3();
            this.angularVelocity.copy(from.angularVelocity);
        }
        if (from.mass !== undefined) {
            this.mass = from.mass;
        }
        if (from.detectCollisions !== undefined) {
            this.detectCollisions = from.detectCollisions;
        }
        if (from.collisionDetectionMode !== undefined) {
            this.collisionDetectionMode = from.collisionDetectionMode;
        }
        if (from.useGravity !== undefined) {
            this.useGravity = from.useGravity;
        }
        if (from.constraints !== undefined) {
            this.constraints = from.constraints;
        }
        return this;
    }

    /**
     * PUBLIC METHODS
     */

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
