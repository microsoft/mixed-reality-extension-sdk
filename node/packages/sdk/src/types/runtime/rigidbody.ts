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
    private _mass: number;
    private _detectCollisions: boolean;
    private _collisionDetectionMode: CollisionDetectionMode;
    private _useGravity: boolean;
    private _constraints: RigidBodyConstraints[] = [];
    // tslint:enable:variable-name

    // late-bound observables
    private $position: Vector3;
    private $rotation: Quaternion;
    private $velocity: Vector3;
    private $angularVelocity: Vector3;

    /**
     * PUBLIC ACCESSORS
     */
    public get position() { return this.$position; }
    public set position(value: Partial<Vector3>) { this.$position = this._position; this._position.copy(value); }
    public get rotation() { return this.$rotation; }
    public set rotation(value) { this.$rotation = this._rotation; this._rotation.copy(value); }
    public get velocity() { return this.$velocity; }
    public set velocity(value: Partial<Vector3>) { this.$velocity = this._velocity; this._velocity.copy(value); }
    public get angularVelocity() { return this.$angularVelocity; }
    public set angularVelocity(value: Partial<Vector3>) {
        this.$angularVelocity = this._angularVelocity;
        this._angularVelocity.copy(value);
    }
    public get mass() { return this._mass; }
    public set mass(value) { this._mass = value; }
    public get detectCollisions() { return this._detectCollisions; }
    public set detectCollisions(value) { this._detectCollisions = value; }
    public get collisionDetectionMode() { return this._collisionDetectionMode; }
    public set collisionDetectionMode(value) { this._collisionDetectionMode = value; }
    public get useGravity() { return this._useGravity; }
    public set useGravity(value) { this._useGravity = value; }
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
        this._velocity = new Vector3();
        this._angularVelocity = new Vector3();
        this._position = new Vector3();
        this._rotation = new Quaternion();
    }

    public copyDirect(srigidbody: Partial<RigidBodyLike>): this {
        if (!srigidbody) {
            return this;
        }
        if (typeof srigidbody.position !== 'undefined') {
            this.$position = this._position;
            this._position.copyDirect(srigidbody.position);
        }
        if (typeof srigidbody.rotation !== 'undefined') {
            this.$rotation = this._rotation;
            this._rotation.copyDirect(srigidbody.rotation);
        }
        if (typeof srigidbody.velocity !== 'undefined') {
            this.$velocity = this._velocity;
            this._velocity.copyDirect(srigidbody.velocity);
        }
        if (typeof srigidbody.angularVelocity !== 'undefined') {
            this.$angularVelocity = this._angularVelocity;
            this._angularVelocity.copyDirect(srigidbody.angularVelocity);
        }
        if (typeof srigidbody.mass !== 'undefined') {
            this._mass = srigidbody.mass;
        }
        if (typeof srigidbody.detectCollisions !== 'undefined') {
            this._detectCollisions = srigidbody.detectCollisions;
        }
        if (typeof srigidbody.collisionDetectionMode !== 'undefined') {
            this._collisionDetectionMode = srigidbody.collisionDetectionMode;
        }
        if (typeof srigidbody.useGravity !== 'undefined') {
            this._useGravity = srigidbody.useGravity;
        }
        if (typeof srigidbody.constraints !== 'undefined') {
            this._constraints = srigidbody.constraints;
        }
        return this;
    }

    public toJSON() {
        return {
            position: this.$position ? this.$position.toJSON() : undefined,
            rotation: this.$rotation ? this.$rotation.toJSON() : undefined,
            velocity: this.$velocity ? this.$velocity.toJSON() : undefined,
            angularVelocity: this.$angularVelocity ? this.$angularVelocity.toJSON() : undefined,
            mass: this._mass,
            detectCollisions: this._detectCollisions,
            collisionDetectionMode: this._collisionDetectionMode,
            useGravity: this._useGravity,
            constraints: this._constraints,
        } as RigidBodyLike;
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
