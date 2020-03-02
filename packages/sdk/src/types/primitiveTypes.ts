/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from '..';

/**
 * Describes the general shape of a primitive. Specifics are described in a [[PrimitiveDefinition]] object.
 */
export enum PrimitiveShape {
	Sphere = 'sphere',
	Box = 'box',
	Capsule = 'capsule',
	Cylinder = 'cylinder',
	Plane = 'plane'
}

export type SpherePrimitiveDefinition = {
	shape: PrimitiveShape.Sphere;
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
};

export type BoxPrimitiveDefinition = {
	shape: PrimitiveShape.Box;
	/**
	 * The bounding box size of the primitive.
	 */
	dimensions?: Partial<Vector3Like>;
};

export type CapsulePrimitiveDefinition = {
	shape: PrimitiveShape.Capsule;
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
};

export type CylinderPrimitiveDefinition = {
	shape: PrimitiveShape.Cylinder;
	/**
	 * The bounding box size of the primitive.
	 */
	dimensions?: Partial<Vector3Like>;
	/**
	 * The number of horizontal or radial segments of spheres, cylinders, capsules, and planes.
	 */
	uSegments?: number;
};

export type PlanePrimitiveDefinition = {
	shape: PrimitiveShape.Plane;
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
};

export type PrimitiveDefinition
	= SpherePrimitiveDefinition
	| BoxPrimitiveDefinition
	| CapsulePrimitiveDefinition
	| CylinderPrimitiveDefinition
	| PlanePrimitiveDefinition
	;
