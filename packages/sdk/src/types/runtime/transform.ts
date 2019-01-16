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

    public get position() { return this._position; }
    public set position(value: Partial<Vector3>) { this._position.copy(value); }
    public get rotation() { return this._rotation; }
    public set rotation(value: Quaternion) { this._rotation.copy(value); }
    public get scale() { return this._scale; }
    public set scale(value: Partial<Vector3>) { this._scale.copy(value); }

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this._position = Vector3.Zero();
        this._rotation = Quaternion.Identity();
        this._scale = Vector3.One();
    }

    public copy(from: Partial<TransformLike>): this {
        if (!from) return this;
        if (from.position !== undefined) this.position = from.position;
        if (from.rotation !== undefined) this._rotation.copy(from.rotation);
        if (from.scale !== undefined) this.scale = from.scale;
        return this;
    }

    public toJSON() {
        return {
            position: this.position.toJSON(),
            rotation: this.rotation.toJSON(),
            scale: this.scale.toJSON(),
        };
    }
}
