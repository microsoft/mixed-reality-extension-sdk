/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Epsilon, Matrix, Scalar, Vector3 } from '.';

// tslint:disable:member-ordering variable-name one-variable-per-declaration trailing-comma no-bitwise curly max-line-length

/**
 * Class representing a vector containing 2 coordinates
 */
export class Vector2 {

    // Statics

    /**
     * Gets a new Vector2(0, 0)
     * @returns a new Vector2
     */
    public static Zero(): Vector2 {
        return new Vector2(0, 0);
    }

    /**
     * Gets a new Vector2(1, 1)
     * @returns a new Vector2
     */
    public static One(): Vector2 {
        return new Vector2(1, 1);
    }

    /**
     * Gets a new Vector2 set from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @returns a new Vector2
     */
    public static FromArray(array: ArrayLike<number>, offset = 0): Vector2 {
        return new Vector2(array[offset], array[offset + 1]);
    }

    /**
     * Sets "result" from the given index element of the given array
     * @param array defines the data source
     * @param offset defines the offset in the data source
     * @param result defines the target vector
     */
    public static FromArrayToRef(array: ArrayLike<number>, offset: number, result: Vector2): void {
        result.x = array[offset];
        result.y = array[offset + 1];
    }

    /**
     * Gets a new Vector2 located for "amount" (float) on the CatmullRom spline defined by the given four Vector2
     * @param value1 defines 1st point of control
     * @param value2 defines 2nd point of control
     * @param value3 defines 3rd point of control
     * @param value4 defines 4th point of control
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static CatmullRom(value1: Vector2, value2: Vector2, value3: Vector2, value4: Vector2, amount: number): Vector2 {
        const squared = amount * amount;
        const cubed = amount * squared;

        const x = 0.5 * ((((2.0 * value2.x) + ((-value1.x + value3.x) * amount)) +
            (((((2.0 * value1.x) - (5.0 * value2.x)) + (4.0 * value3.x)) - value4.x) * squared)) +
            ((((-value1.x + (3.0 * value2.x)) - (3.0 * value3.x)) + value4.x) * cubed));

        const y = 0.5 * ((((2.0 * value2.y) + ((-value1.y + value3.y) * amount)) +
            (((((2.0 * value1.y) - (5.0 * value2.y)) + (4.0 * value3.y)) - value4.y) * squared)) +
            ((((-value1.y + (3.0 * value2.y)) - (3.0 * value3.y)) + value4.y) * cubed));

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 set with same the coordinates than "value" ones if the vector "value" is in the square defined by "min" and "max".
     * If a coordinate of "value" is lower than "min" coordinates, the returned Vector2 is given this "min" coordinate.
     * If a coordinate of "value" is greater than "max" coordinates, the returned Vector2 is given this "max" coordinate
     * @param value defines the value to clamp
     * @param min defines the lower limit
     * @param max defines the upper limit
     * @returns a new Vector2
     */
    public static Clamp(value: Vector2, min: Vector2, max: Vector2): Vector2 {
        let x = value.x;
        x = (x > max.x) ? max.x : x;
        x = (x < min.x) ? min.x : x;

        let y = value.y;
        y = (y > max.y) ? max.y : y;
        y = (y < min.y) ? min.y : y;

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 located for "amount" (float) on the Hermite spline defined by the vectors "value1", "value3", "tangent1", "tangent2"
     * @param value1 defines the 1st control point
     * @param tangent1 defines the outgoing tangent
     * @param value2 defines the 2nd control point
     * @param tangent2 defines the incoming tangent
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static Hermite(value1: Vector2, tangent1: Vector2, value2: Vector2, tangent2: Vector2, amount: number): Vector2 {
        const squared = amount * amount;
        const cubed = amount * squared;
        const part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
        const part2 = (-2.0 * cubed) + (3.0 * squared);
        const part3 = (cubed - (2.0 * squared)) + amount;
        const part4 = cubed - squared;

        const x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
        const y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);

        return new Vector2(x, y);
    }

    /**
     * Returns a new Vector2 located for "amount" (float) on the linear interpolation between the vector "start" adn the vector "end".
     * @param start defines the start vector
     * @param end defines the end vector
     * @param amount defines the interpolation factor
     * @returns a new Vector2
     */
    public static Lerp(start: Vector2, end: Vector2, amount: number): Vector2 {
        const x = start.x + ((end.x - start.x) * amount);
        const y = start.y + ((end.y - start.y) * amount);
        return new Vector2(x, y);
    }

    /**
     * Gets the dot product of the vector "left" and the vector "right"
     * @param left defines first vector
     * @param right defines second vector
     * @returns the dot product (float)
     */
    public static Dot(left: Vector2, right: Vector2): number {
        return left.x * right.x + left.y * right.y;
    }

    /**
     * Returns a new Vector2 equal to the normalized given vector
     * @param vector defines the vector to normalize
     * @returns a new Vector2
     */
    public static Normalize(vector: Vector2): Vector2 {
        const newVector = vector.clone();
        newVector.normalize();
        return newVector;
    }

    /**
     * Gets a new Vector2 set with the minimal coordinate values from the "left" and "right" vectors
     * @param left defines 1st vector
     * @param right defines 2nd vector
     * @returns a new Vector2
     */
    public static Minimize(left: Vector2, right: Vector2): Vector2 {
        const x = (left.x < right.x) ? left.x : right.x;
        const y = (left.y < right.y) ? left.y : right.y;
        return new Vector2(x, y);
    }

    /**
     * Gets a new Vecto2 set with the maximal coordinate values from the "left" and "right" vectors
     * @param left defines 1st vector
     * @param right defines 2nd vector
     * @returns a new Vector2
     */
    public static Maximize(left: Vector2, right: Vector2): Vector2 {
        const x = (left.x > right.x) ? left.x : right.x;
        const y = (left.y > right.y) ? left.y : right.y;
        return new Vector2(x, y);
    }

    /**
     * Gets a new Vector2 set with the transformed coordinates of the given vector by the given transformation matrix
     * @param vector defines the vector to transform
     * @param transformation defines the matrix to apply
     * @returns a new Vector2
     */
    public static Transform(vector: Vector2, transformation: Matrix): Vector2 {
        const r = Vector2.Zero();
        Vector2.TransformToRef(vector, transformation, r);
        return r;
    }

    /**
     * Transforms the given vector coordinates by the given transformation matrix and stores the result in the vector "result" coordinates
     * @param vector defines the vector to transform
     * @param transformation defines the matrix to apply
     * @param result defines the target vector
     */
    public static TransformToRef(vector: Vector2, transformation: Matrix, result: Vector2) {
        const m = transformation.m;
        const x = (vector.x * m[0]) + (vector.y * m[4]) + m[12];
        const y = (vector.x * m[1]) + (vector.y * m[5]) + m[13];
        result.x = x;
        result.y = y;
    }

    /**
     * Determines if a given vector is included in a triangle
     * @param p defines the vector to test
     * @param p0 defines 1st triangle point
     * @param p1 defines 2nd triangle point
     * @param p2 defines 3rd triangle point
     * @returns true if the point "p" is in the triangle defined by the vertors "p0", "p1", "p2"
     */
    public static PointInTriangle(p: Vector2, p0: Vector2, p1: Vector2, p2: Vector2) {
        const a = 1 / 2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
        const sign = a < 0 ? -1 : 1;
        const s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
        const t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

        return s > 0 && t > 0 && (s + t) < 2 * a * sign;
    }

    /**
     * Gets the distance between the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns the distance between vectors
     */
    public static Distance(value1: Vector2, value2: Vector2): number {
        return Math.sqrt(Vector2.DistanceSquared(value1, value2));
    }

    /**
     * Returns the squared distance between the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns the squared distance between vectors
     */
    public static DistanceSquared(value1: Vector2, value2: Vector2): number {
        const x = value1.x - value2.x;
        const y = value1.y - value2.y;
        return (x * x) + (y * y);
    }

    /**
     * Gets a new Vector2 located at the center of the vectors "value1" and "value2"
     * @param value1 defines first vector
     * @param value2 defines second vector
     * @returns a new Vector2
     */
    public static Center(value1: Vector2, value2: Vector2): Vector2 {
        const center = value1.add(value2);
        center.scaleInPlace(0.5);
        return center;
    }

    /**
     * Gets the shortest distance (float) between the point "p" and the segment defined by the two points "segA" and "segB".
     * @param p defines the middle point
     * @param segA defines one point of the segment
     * @param segB defines the other point of the segment
     * @returns the shortest distance
     */
    public static DistanceOfPointFromSegment(p: Vector2, segA: Vector2, segB: Vector2): number {
        const l2 = Vector2.DistanceSquared(segA, segB);
        if (l2 === 0.0) {
            return Vector2.Distance(p, segA);
        }
        const v = segB.subtract(segA);
        const t = Math.max(0, Math.min(1, Vector2.Dot(p.subtract(segA), v) / l2));
        const proj = segA.add(v.multiplyByFloats(t, t));
        return Vector2.Distance(p, proj);
    }
    /**
     * Creates a new Vector2 from the given x and y coordinates
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     */
    constructor(
        /** defines the first coordinate */
        public x = 0,
        /** defines the second coordinate */
        public y = 0) {
    }

    /**
     * Gets a string with the Vector2 coordinates
     * @returns a string with the Vector2 coordinates
     */
    public toString(): string {
        return "{X: " + this.x + " Y:" + this.y + "}";
    }

    /**
     * Returns a JSON representation of this vector. This is necessary due to the way
     * Actors detect changes on components like the actor's transform. They do this by adding
     * properties for observation, and we don't want these properties serialized.
     */
    public toJSON() {
        return {
            x: this.x,
            y: this.y,
        };
    }

    /**
     * Gets class name
     * @returns the string "Vector2"
     */
    public getClassName(): string {
        return "Vector2";
    }

    /**
     * Gets current vector hash code
     * @returns the Vector2 hash code as a number
     */
    public getHashCode(): number {
        let hash = this.x || 0;
        hash = (hash * 397) ^ (this.y || 0);
        return hash;
    }

    // Operators

    /**
     * Sets the Vector2 coordinates in the given array or Float32Array from the given index.
     * @param array defines the source array
     * @param index defines the offset in source array
     * @returns the current Vector2
     */
    public toArray(array: number[], index = 0): Vector2 {
        array[index] = this.x;
        array[index + 1] = this.y;
        return this;
    }

    /**
     * Copy the current vector to an array
     * @returns a new array with 2 elements: the Vector2 coordinates.
     */
    public asArray(): number[] {
        const result = new Array<number>();
        this.toArray(result, 0);
        return result;
    }

    /**
     * Sets the Vector2 coordinates with the given Vector2 coordinates
     * @param source defines the source Vector2
     * @returns the current updated Vector2
     */
    public copyFrom(source: Vector2): Vector2 {
        this.x = source.x;
        this.y = source.y;
        return this;
    }

    /**
     * Sets the Vector2 coordinates with the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns the current updated Vector2
     */
    public copyFromFloats(x: number, y: number): Vector2 {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Sets the Vector2 coordinates with the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns the current updated Vector2
     */
    public set(x: number, y: number): Vector2 {
        return this.copyFromFloats(x, y);
    }
    /**
     * Add another vector with the current one
     * @param otherVector defines the other vector
     * @returns a new Vector2 set with the addition of the current Vector2 and the given one coordinates
     */
    public add(otherVector: Vector2): Vector2 {
        return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the addition of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public addToRef(otherVector: Vector2, result: Vector2): Vector2 {
        result.x = this.x + otherVector.x;
        result.y = this.y + otherVector.y;
        return this;
    }

    /**
     * Set the Vector2 coordinates by adding the given Vector2 coordinates
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public addInPlace(otherVector: Vector2): Vector2 {
        this.x += otherVector.x;
        this.y += otherVector.y;
        return this;
    }

    /**
     * Gets a new Vector2 by adding the current Vector2 coordinates to the given Vector3 x, y coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public addVector3(otherVector: Vector3): Vector2 {
        return new Vector2(this.x + otherVector.x, this.y + otherVector.y);
    }

    /**
     * Gets a new Vector2 set with the subtracted coordinates of the given one from the current Vector2
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public subtract(otherVector: Vector2): Vector2 {
        return new Vector2(this.x - otherVector.x, this.y - otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the subtraction of the given one from the current Vector2 coordinates.
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public subtractToRef(otherVector: Vector2, result: Vector2): Vector2 {
        result.x = this.x - otherVector.x;
        result.y = this.y - otherVector.y;
        return this;
    }
    /**
     * Sets the current Vector2 coordinates by subtracting from it the given one coordinates
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public subtractInPlace(otherVector: Vector2): Vector2 {
        this.x -= otherVector.x;
        this.y -= otherVector.y;
        return this;
    }

    /**
     * Multiplies in place the current Vector2 coordinates by the given ones
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public multiplyInPlace(otherVector: Vector2): Vector2 {
        this.x *= otherVector.x;
        this.y *= otherVector.y;
        return this;
    }

    /**
     * Returns a new Vector2 set with the multiplication of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public multiply(otherVector: Vector2): Vector2 {
        return new Vector2(this.x * otherVector.x, this.y * otherVector.y);
    }

    /**
     * Sets "result" coordinates with the multiplication of the current Vector2 and the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public multiplyToRef(otherVector: Vector2, result: Vector2): Vector2 {
        result.x = this.x * otherVector.x;
        result.y = this.y * otherVector.y;
        return this;
    }

    /**
     * Gets a new Vector2 set with the Vector2 coordinates multiplied by the given floats
     * @param x defines the first coordinate
     * @param y defines the second coordinate
     * @returns a new Vector2
     */
    public multiplyByFloats(x: number, y: number): Vector2 {
        return new Vector2(this.x * x, this.y * y);
    }

    /**
     * Returns a new Vector2 set with the Vector2 coordinates divided by the given one coordinates
     * @param otherVector defines the other vector
     * @returns a new Vector2
     */
    public divide(otherVector: Vector2): Vector2 {
        return new Vector2(this.x / otherVector.x, this.y / otherVector.y);
    }

    /**
     * Sets the "result" coordinates with the Vector2 divided by the given one coordinates
     * @param otherVector defines the other vector
     * @param result defines the target vector
     * @returns the unmodified current Vector2
     */
    public divideToRef(otherVector: Vector2, result: Vector2): Vector2 {
        result.x = this.x / otherVector.x;
        result.y = this.y / otherVector.y;
        return this;
    }

    /**
     * Divides the current Vector2 coordinates by the given ones
     * @param otherVector defines the other vector
     * @returns the current updated Vector2
     */
    public divideInPlace(otherVector: Vector2): Vector2 {
        return this.divideToRef(otherVector, this);
    }

    /**
     * Gets a new Vector2 with current Vector2 negated coordinates
     * @returns a new Vector2
     */
    public negate(): Vector2 {
        return new Vector2(-this.x, -this.y);
    }

    /**
     * Multiply the Vector2 coordinates by scale
     * @param scale defines the scaling factor
     * @returns the current updated Vector2
     */
    public scaleInPlace(scale: number): Vector2 {
        this.x *= scale;
        this.y *= scale;
        return this;
    }

    /**
     * Returns a new Vector2 scaled by "scale" from the current Vector2
     * @param scale defines the scaling factor
     * @returns a new Vector2
     */
    public scale(scale: number): Vector2 {
        const result = new Vector2(0, 0);
        this.scaleToRef(scale, result);
        return result;
    }

    /**
     * Scale the current Vector2 values by a factor to a given Vector2
     * @param scale defines the scale factor
     * @param result defines the Vector2 object where to store the result
     * @returns the unmodified current Vector2
     */
    public scaleToRef(scale: number, result: Vector2): Vector2 {
        result.x = this.x * scale;
        result.y = this.y * scale;
        return this;
    }

    /**
     * Scale the current Vector2 values by a factor and add the result to a given Vector2
     * @param scale defines the scale factor
     * @param result defines the Vector2 object where to store the result
     * @returns the unmodified current Vector2
     */
    public scaleAndAddToRef(scale: number, result: Vector2): Vector2 {
        result.x += this.x * scale;
        result.y += this.y * scale;
        return this;
    }

    /**
     * Gets a boolean if two vectors are equals
     * @param otherVector defines the other vector
     * @returns true if the given vector coordinates strictly equal the current Vector2 ones
     */
    public equals(otherVector: Vector2): boolean {
        return otherVector && this.x === otherVector.x && this.y === otherVector.y;
    }

    /**
     * Gets a boolean if two vectors are equals (using an epsilon value)
     * @param otherVector defines the other vector
     * @param epsilon defines the minimal distance to consider equality
     * @returns true if the given vector coordinates are close to the current ones by a distance of epsilon.
     */
    public equalsWithEpsilon(otherVector: Vector2, epsilon: number = Epsilon): boolean {
        return otherVector && Scalar.WithinEpsilon(this.x, otherVector.x, epsilon) && Scalar.WithinEpsilon(this.y, otherVector.y, epsilon);
    }

    /**
     * Gets a new Vector2 from current Vector2 floored values
     * @returns a new Vector2
     */
    public floor(): Vector2 {
        return new Vector2(Math.floor(this.x), Math.floor(this.y));
    }

    /**
     * Gets a new Vector2 from current Vector2 floored values
     * @returns a new Vector2
     */
    public fract(): Vector2 {
        return new Vector2(this.x - Math.floor(this.x), this.y - Math.floor(this.y));
    }

    // Properties

    /**
     * Gets the length of the vector
     * @returns the vector length (float)
     */
    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Gets the vector squared length
     * @returns the vector squared length (float)
     */
    public lengthSquared(): number {
        return (this.x * this.x + this.y * this.y);
    }

    // Methods

    /**
     * Normalize the vector
     * @returns the current updated Vector2
     */
    public normalize(): Vector2 {
        const len = this.length();

        if (len === 0) {
            return this;
        }

        const num = 1.0 / len;

        this.x *= num;
        this.y *= num;

        return this;
    }

    /**
     * Gets a new Vector2 copied from the Vector2
     * @returns a new Vector2
     */
    public clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }
}
