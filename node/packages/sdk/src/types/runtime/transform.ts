/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Quaternion, QuaternionLike, Vector3, Vector3Like } from '../..';

export interface TransformLike {
    position: Partial<Vector3Like>;
    rotation: QuaternionLike;
    scale: Partial<Vector3Like>;
}

export class Transform implements TransformLike {
    // tslint:disable:variable-name
    private _position: Vector3;
    private _rotation: Quaternion;
    private _scale: Vector3;
    // tslint:enable:variable-name

    // Late-bound properties
    private $position: Vector3;
    private $rotation: Quaternion;
    private $scale: Vector3;

    /**
     * PUBLIC ACCESSORS
     */

    public get position() { return this.$position; }
    public set position(value: Partial<Vector3>) { this.$position = this._position; this._position.copy(value); }

    public get rotation() { return this.$rotation; }
    public set rotation(value: Quaternion) { this.$rotation = this._rotation; this._rotation.copy(value); }

    public get scale() { return this.$scale; }
    public set scale(value: Partial<Vector3>) { this.$scale = this._scale; this._scale.copy(value); }

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this._position = Vector3.Zero();
        this._rotation = Quaternion.Identity();
        this._scale = Vector3.One();
        this.$position = this._position;
        this.$rotation = this._rotation;
        this.$scale = this._scale;
    }

    public copyDirect(from: Partial<TransformLike>): this {
        if (!from) {
            return this;
        }
        if (typeof from.position !== 'undefined') {
            this.$position = this._position;
            this._position.copyDirect(from.position);
        }
        if (typeof from.rotation !== 'undefined') {
            this.$rotation = this._rotation;
            this._rotation.copyDirect(from.rotation);
        }
        if (typeof from.scale !== 'undefined') {
            this.$scale = this._scale;
            this._scale.copyDirect(from.scale);
        }
        return this;
    }

    public copy(from: Partial<TransformLike>): this {
        if (!from) {
            return this;
        }
        if (typeof from.position !== 'undefined') {
            this.$position = this._position;
            this._position.copy(from.position);
        }
        if (typeof from.rotation !== 'undefined') {
            this.$rotation = this._rotation;
            this._rotation.copy(from.rotation);
        }
        if (typeof from.scale !== 'undefined') {
            this.$scale = this._scale;
            this._scale.copy(from.scale);
        }
        return this;
    }

    public toJSON() {
        return {
            position: this.$position ? this.$position.toJSON() : undefined,
            rotation: this.$rotation ? this.$rotation.toJSON() : undefined,
            scale: this.$scale ? this.$scale.toJSON() : undefined,
        } as TransformLike;
    }
}
