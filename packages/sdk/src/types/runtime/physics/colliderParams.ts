/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from "../../..";

/**
 * Collider parameters specific to a sphere collider.
 */
export interface SphereColliderParams {
    colliderType: 'sphere';
    center: Readonly<Vector3Like>;
    radius: number;
}

/**
 * Collider parameters specific to a box collider
 */
export interface BoxColliderParams {
    colliderType: 'box';
    center: Readonly<Vector3Like>;
    size: Readonly<Vector3Like>;
}

/**
 * All collider parameter types.
 */
export type ColliderParams
    = SphereColliderParams
    | BoxColliderParams
    ;
