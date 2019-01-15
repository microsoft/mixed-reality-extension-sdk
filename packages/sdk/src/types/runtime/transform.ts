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
    public position: Vector3;
    public rotation: Quaternion;
    public scale: Vector3;

    /**
     * PUBLIC METHODS
     */

    constructor() {
        this.position = Vector3.Zero();
        this.rotation = Quaternion.Identity();
        this.scale = Vector3.One();
    }

    public copy(from: Partial<TransformLike>): this {
        if (!from) {
            return this;
        }
        if (from.position !== undefined) {
            if (!this.position) this.position = Vector3.Zero();
            this.position.copy(from.position);
        }
        if (from.rotation !== undefined) {
            if (!this.rotation) this.rotation = Quaternion.Identity();
            this.rotation.copy(from.rotation);
        }
        if (from.scale !== undefined) {
            if (!this.scale) this.scale = Vector3.One();
            this.scale.copy(from.scale);
        }
        return this;
    }
}
