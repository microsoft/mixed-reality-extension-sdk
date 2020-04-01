/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from '@microsoft/mixed-reality-extension-shared';
import { ColliderType } from "../..";

/**
 * Collider parameters specific to a sphere collider.
 */
export type SphereColliderGeometry = {
	shape: ColliderType.Sphere;
	center?: Readonly<Vector3Like>;
	radius?: number;
};

/**
 * Collider parameters specific to a box collider
 */
export type BoxColliderGeometry = {
	shape: ColliderType.Box;
	center?: Readonly<Vector3Like>;
	size?: Readonly<Vector3Like>;
};

/**
 * Collider parameters specific to a capsule collider
 */
export type CapsuleColliderGeometry = {
	shape: ColliderType.Capsule;
	center?: Readonly<Vector3Like>;
	size?: Readonly<Vector3Like>;
};

/**
 * A best-guess shape for the currently assigned mesh
 */
export type AutoColliderGeometry = {
	shape: ColliderType.Auto;
};

/**
 * All collider parameter types.
 */
export type ColliderGeometry
	= SphereColliderGeometry
	| BoxColliderGeometry
	| CapsuleColliderGeometry
	| AutoColliderGeometry
	;
