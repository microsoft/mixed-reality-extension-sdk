/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from "../../..";

/**
 * Collider parameters specific to a sphere collider.
 */
export interface SphereColliderGeometry {
	shape: 'sphere';
	center?: Readonly<Vector3Like>;
	radius?: number;
}

/**
 * Collider parameters specific to a box collider
 */
export interface BoxColliderGeometry {
	shape: 'box';
	center?: Readonly<Vector3Like>;
	size?: Readonly<Vector3Like>;
}

export interface CapsuleColliderGeometry {
	shape: 'capsule';
	center?: Readonly<Vector3Like>;
	size?: Readonly<Vector3Like>;
}

/** A best-guess shape for the currently assigned mesh */
export interface AutoColliderGeometry {
	shape: 'auto';
}

/**
 * All collider parameter types.
 */
export type ColliderGeometry
	= SphereColliderGeometry
	| BoxColliderGeometry
	| CapsuleColliderGeometry
	| AutoColliderGeometry
	;
