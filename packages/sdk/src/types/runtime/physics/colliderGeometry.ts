/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from "../../..";

/**
 * Collider parameters specific to a sphere collider.
 */
export interface SphereColliderGeometry {
    colliderType: 'sphere';
    center?: Readonly<Vector3Like>;
    radius?: number;
}

/**
 * Collider parameters specific to a box collider
 */
export interface BoxColliderGeometry {
    colliderType: 'box';
    center?: Readonly<Vector3Like>;
    size?: Readonly<Vector3Like>;
}

export interface MeshColliderGeometry {
    colliderType: 'mesh';
}

export interface CapsuleColliderGeometry {
    colliderType: 'capsule';
}

/**
 * All collider parameter types.
 */
export type ColliderGeometry
    = SphereColliderGeometry
    | BoxColliderGeometry
    | MeshColliderGeometry
    ;
