/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector3Like } from '..';

/**
 * Describes the general shape of a primitive. Specifics are described in a [[PrimitiveDefinition]] object.
 */
export enum PrimitiveShape {

    /**
     * The primitive is a sphere with a radius of [[PrimitiveDefinition.radius]], horizontal segment count
     * [[PrimitiveDefinition.uSegments]], and vertical segment count [[PrimitiveDefinition.vSegments]], centered
     * at the origin.
     */
    Sphere = 'sphere',

    /**
     * The primitive is a box with dimensions defined by [[PrimitiveDefinition.dimensions]], centered at the origin.
     */
    Box = 'box',

    /**
     * The primitive is a capsule whose height (not counting caps) and axis are defined by the largest component of
     * [[PrimitiveDefinition.dimensions]], with radius [[PrimitiveDefinition.radius]], radial segment count
     * [[PrimitiveDefinition.uSegments]], and axial segment count [[PrimitiveDefinition.vSegments]], centered at
     * the origin.
     */
    Capsule = 'capsule',

    /**
     * The primitive is a cylinder whose height and axis are defined by the largest component of
     * [[PrimitiveDefinition.dimensions]], with radius [[PrimitiveDefinition.radius]], and radial segment count
     * [[PrimitiveDefinition.uSegments]], centered at the origin.
     */
    Cylinder = 'cylinder',

    /**
     * The primitive is a plane with dimensions from the x and z coordinates of [[PrimitiveDefinition.dimensions]] (y
     * coordinate is ignored), horizontal segment count [[PrimitiveDefinition.uSegments]], and vertical segment count
     * [[PrimitiveDefinition.vSegments]], centered at the origin.
     */
    Plane = 'plane',

    /**
     * The primitive is a sphere with a radius of [[PrimitiveDefinition.radius]], horizontal segment count
     * [[PrimitiveDefinition.uSegments]], and vertical segment count [[PrimitiveDefinition.vSegments]], with normals
     * pointed inward, centered at the origin.
     */
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
     * The radius of spheres, cylinders, and capsules.
     */
    radius?: number;

    /**
     * The size of boxes, cylinders, capsules, and planes.
     */
    dimensions?: Vector3Like;

    /**
     * The number of horizontal or radial segments of spheres, cylinders, capsules, and planes.
     */
    uSegments?: number;

    /**
     * The number of vertical or axial segments of spheres, capsules, and planes.
     */
    vSegments?: number;
}
