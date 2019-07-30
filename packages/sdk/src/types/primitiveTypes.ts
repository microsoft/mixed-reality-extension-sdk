/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from '..';

/**
 * Describes the general shape of a primitive. Specifics are described in a [[PrimitiveDefinition]] object.
 */
export enum PrimitiveShape {
	Box = 'box',
	Capsule = 'capsule',
	Cylinder = 'cylinder',
	Plane = 'plane',
	InnerSphere = 'inner-sphere'
}

/**
 * The size, shape, and description of a primitive.
 */
export interface PrimitiveDefinition {
	// TODO: Make this a discriminated union type.
	/**
	 * The general shape of the defined primitive.
	 */
	shape: PrimitiveShape;

	/**
	 * The bounding box size of the primitive.
	 */
	dimensions?: Partial<Vector3Like>;

	/**
	 * The number of horizontal or radial segments of spheres, cylinders, capsules, and planes.
	 */
	uSegments?: number;

	/**
	 * The number of vertical or axial segments of spheres, capsules, and planes.
	 */
	vSegments?: number;
}
