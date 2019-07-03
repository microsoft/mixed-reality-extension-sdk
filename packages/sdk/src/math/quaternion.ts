/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Matrix, Vector3 } from '.';
import { MathTmp } from './tmp';

// tslint:disable:member-ordering variable-name one-variable-per-declaration trailing-comma no-bitwise curly

export interface QuaternionLike {
	x: number;
	y: number;
	z: number;
	w: number;
}

/**
 * Class used to store quaternion data
 * @see https://en.wikipedia.org/wiki/Quaternion
 */
export class Quaternion implements QuaternionLike {

	/**
	 * Creates a new Quaternion from the given floats
	 * @param x defines the first component (0 by default)
	 * @param y defines the second component (0 by default)
	 * @param z defines the third component (0 by default)
	 * @param w defines the fourth component (1.0 by default)
	 */
	constructor(
		/** defines the first component (0 by default) */
		public x = 0.0,
		/** defines the second component (0 by default) */
		public y = 0.0,
		/** defines the third component (0 by default) */
		public z = 0.0,
		/** defines the fourth component (1.0 by default) */
		public w = 1.0) {
	}

	/**
	 * Gets a string representation for the current quaternion
	 * @returns a string with the Quaternion coordinates
	 */
	public toString(): string {
		return "{X: " + this.x + " Y:" + this.y + " Z:" + this.z + " W:" + this.w + "}";
	}

	/**
	 * Returns a JSON representation of this quaternion. This is necessary due to the way
	 * Actors detect changes on components like the actor's transform. They do this by adding
	 * properties for observation, and we don't want these properties serialized.
	 */
	public toJSON() {
		return {
			x: this.x,
			y: this.y,
			z: this.z,
			w: this.w,
		} as QuaternionLike;
	}

	/**
	 * Gets the class name of the quaternion
	 * @returns the string "Quaternion"
	 */
	public getClassName(): string {
		return "Quaternion";
	}

	/**
	 * Gets a hash code for this quaternion
	 * @returns the quaternion hash code
	 */
	public getHashCode(): number {
		let hash = this.x || 0;
		hash = (hash * 397) ^ (this.y || 0);
		hash = (hash * 397) ^ (this.z || 0);
		hash = (hash * 397) ^ (this.w || 0);
		return hash;
	}

	/**
	 * Copy the quaternion to an array
	 * @returns a new array populated with 4 elements from the quaternion coordinates
	 */
	public asArray(): number[] {
		return [this.x, this.y, this.z, this.w];
	}
	/**
	 * Check if two quaternions are equals
	 * @param otherQuaternion defines the second operand
	 * @return true if the current quaternion and the given one coordinates are strictly equals
	 */
	public equals(otherQuaternion: Quaternion): boolean {
		return (
			otherQuaternion &&
			this.x === otherQuaternion.x &&
			this.y === otherQuaternion.y &&
			this.z === otherQuaternion.z &&
			this.w === otherQuaternion.w);
	}

	/**
	 * Clone the current quaternion
	 * @returns a new quaternion copied from the current one
	 */
	public clone(): Quaternion {
		return new Quaternion(this.x, this.y, this.z, this.w);
	}

	/**
	 * Copy a quaternion to the current one
	 * @param other defines the other quaternion
	 * @returns the updated current quaternion
	 */
	public copyFrom(other: Quaternion): Quaternion {
		this.x = other.x;
		this.y = other.y;
		this.z = other.z;
		this.w = other.w;
		return this;
	}

	/**
	 * Updates the Quaternion from the value.
	 * @param from The value to read from.
	 */
	public copy(from: Partial<QuaternionLike>): this {
		if (!from) return this;
		if (from.x !== undefined) this.x = from.x;
		if (from.y !== undefined) this.y = from.y;
		if (from.z !== undefined) this.z = from.z;
		if (from.w !== undefined) this.w = from.w;
		return this;
	}

	/**
	 * Updates the current quaternion with the given float coordinates
	 * @param x defines the x coordinate
	 * @param y defines the y coordinate
	 * @param z defines the z coordinate
	 * @param w defines the w coordinate
	 * @returns the updated current quaternion
	 */
	public copyFromFloats(x: number, y: number, z: number, w: number): Quaternion {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
		return this;
	}

	/**
	 * Updates the current quaternion from the given float coordinates
	 * @param x defines the x coordinate
	 * @param y defines the y coordinate
	 * @param z defines the z coordinate
	 * @param w defines the w coordinate
	 * @returns the updated current quaternion
	 */
	public set(x: number, y: number, z: number, w: number): Quaternion {
		return this.copyFromFloats(x, y, z, w);
	}

	/**
	 * Adds two quaternions
	 * @param other defines the second operand
	 * @returns a new quaternion as the addition result of the given one and the current quaternion
	 */
	public add(other: Quaternion): Quaternion {
		return new Quaternion(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
	}

	/**
	 * Add a quaternion to the current one
	 * @param other defines the quaternion to add
	 * @returns the current quaternion
	 */
	public addInPlace(other: Quaternion): Quaternion {
		this.x += other.x;
		this.y += other.y;
		this.z += other.z;
		this.w += other.w;
		return this;
	}
	/**
	 * Subtract two quaternions
	 * @param other defines the second operand
	 * @returns a new quaternion as the subtraction result of the given one from the current one
	 */
	public subtract(other: Quaternion): Quaternion {
		return new Quaternion(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
	}

	/**
	 * Multiplies the current quaternion by a scale factor
	 * @param value defines the scale factor
	 * @returns a new quaternion set by multiplying the current quaternion coordinates by the float "scale"
	 */
	public scale(value: number): Quaternion {
		return new Quaternion(this.x * value, this.y * value, this.z * value, this.w * value);
	}

	/**
	 * Scale the current quaternion values by a factor and stores the result to a given quaternion
	 * @param scale defines the scale factor
	 * @param result defines the Quaternion object where to store the result
	 * @returns the unmodified current quaternion
	 */
	public scaleToRef(scale: number, result: Quaternion): Quaternion {
		result.x = this.x * scale;
		result.y = this.y * scale;
		result.z = this.z * scale;
		result.w = this.w * scale;
		return this;
	}

	/**
	 * Multiplies in place the current quaternion by a scale factor
	 * @param value defines the scale factor
	 * @returns the current modified quaternion
	 */
	public scaleInPlace(value: number): Quaternion {
		this.x *= value;
		this.y *= value;
		this.z *= value;
		this.w *= value;

		return this;
	}

	/**
	 * Scale the current quaternion values by a factor and add the result to a given quaternion
	 * @param scale defines the scale factor
	 * @param result defines the Quaternion object where to store the result
	 * @returns the unmodified current quaternion
	 */
	public scaleAndAddToRef(scale: number, result: Quaternion): Quaternion {
		result.x += this.x * scale;
		result.y += this.y * scale;
		result.z += this.z * scale;
		result.w += this.w * scale;
		return this;
	}

	/**
	 * Multiplies two quaternions
	 * @param q1 defines the second operand
	 * @returns a new quaternion set as the multiplication result of the current one with the given one "q1"
	 */
	public multiply(q1: Quaternion): Quaternion {
		const result = new Quaternion(0, 0, 0, 1.0);
		this.multiplyToRef(q1, result);
		return result;
	}
	/**
	 * Sets the given "result" as the the multiplication result of the current one with the given one "q1"
	 * @param q1 defines the second operand
	 * @param result defines the target quaternion
	 * @returns the current quaternion
	 */
	public multiplyToRef(q1: Quaternion, result: Quaternion): Quaternion {
		const x = this.x * q1.w + this.y * q1.z - this.z * q1.y + this.w * q1.x;
		const y = -this.x * q1.z + this.y * q1.w + this.z * q1.x + this.w * q1.y;
		const z = this.x * q1.y - this.y * q1.x + this.z * q1.w + this.w * q1.z;
		const w = -this.x * q1.x - this.y * q1.y - this.z * q1.z + this.w * q1.w;
		result.copyFromFloats(x, y, z, w);
		return this;
	}

	/**
	 * Updates the current quaternion with the multiplication of itself with the given one "q1"
	 * @param q1 defines the second operand
	 * @returns the currentupdated quaternion
	 */
	public multiplyInPlace(q1: Quaternion): Quaternion {
		this.multiplyToRef(q1, this);
		return this;
	}

	/**
	 * Conjugates (1-q) the current quaternion and stores the result in the given quaternion
	 * @param ref defines the target quaternion
	 * @returns the current quaternion
	 */
	public conjugateToRef(ref: Quaternion): Quaternion {
		ref.copyFromFloats(-this.x, -this.y, -this.z, this.w);
		return this;
	}

	/**
	 * Conjugates in place (1-q) the current quaternion
	 * @returns the current updated quaternion
	 */
	public conjugateInPlace(): Quaternion {
		this.x *= -1;
		this.y *= -1;
		this.z *= -1;
		return this;
	}

	/**
	 * Conjugates in place (1-q) the current quaternion
	 * @returns a new quaternion
	 */
	public conjugate(): Quaternion {
		const result = new Quaternion(-this.x, -this.y, -this.z, this.w);
		return result;
	}

	/**
	 * Gets length of current quaternion
	 * @returns the quaternion length (float)
	 */
	public length(): number {
		return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z) + (this.w * this.w));
	}

	/**
	 * Normalize in place the current quaternion
	 * @returns the current updated quaternion
	 */
	public normalize(): Quaternion {
		const length = 1.0 / this.length();
		this.x *= length;
		this.y *= length;
		this.z *= length;
		this.w *= length;
		return this;
	}

	/**
	 * Returns a new Vector3 set with the Euler angles translated from the current quaternion
	 * @param order is a reserved parameter and is ignore for now
	 * @returns a new Vector3 containing the Euler angles
	 */
	public toEulerAngles(order = "YZX"): Vector3 {
		const result = Vector3.Zero();
		this.toEulerAnglesToRef(result, order);
		return result;
	}

	/**
	 * Sets the given vector3 "result" with the Euler angles translated from the current quaternion
	 * @param result defines the vector which will be filled with the Euler angles
	 * @param order is a reserved parameter and is ignore for now
	 * @returns the current unchanged quaternion
	 */
	public toEulerAnglesToRef(result: Vector3, order = "YZX"): Quaternion {

		const qz = this.z;
		const qx = this.x;
		const qy = this.y;
		const qw = this.w;

		const sqw = qw * qw;
		const sqz = qz * qz;
		const sqx = qx * qx;
		const sqy = qy * qy;

		const zAxisY = qy * qz - qx * qw;
		const limit = .4999999;

		if (zAxisY < -limit) {
			result.y = 2 * Math.atan2(qy, qw);
			result.x = Math.PI / 2;
			result.z = 0;
		} else if (zAxisY > limit) {
			result.y = 2 * Math.atan2(qy, qw);
			result.x = -Math.PI / 2;
			result.z = 0;
		} else {
			result.z = Math.atan2(2.0 * (qx * qy + qz * qw), (-sqz - sqx + sqy + sqw));
			result.x = Math.asin(-2.0 * (qz * qy - qx * qw));
			result.y = Math.atan2(2.0 * (qz * qx + qy * qw), (sqz - sqx - sqy + sqw));
		}

		return this;

	}

	/**
	 * Updates the given rotation matrix with the current quaternion values
	 * @param result defines the target matrix
	 * @returns the current unchanged quaternion
	 */
	public toRotationMatrix(result: Matrix): Quaternion {
		Matrix.FromQuaternionToRef(this, result);
		return this;
	}

	/**
	 * Updates the current quaternion from the given rotation matrix values
	 * @param matrix defines the source matrix
	 * @returns the current updated quaternion
	 */
	public fromRotationMatrix(matrix: Matrix): Quaternion {
		Quaternion.FromRotationMatrixToRef(matrix, this);
		return this;
	}

	// Statics

	/**
	 * Creates a new quaternion from a rotation matrix
	 * @param matrix defines the source matrix
	 * @returns a new quaternion created from the given rotation matrix values
	 */
	public static FromRotationMatrix(matrix: Matrix): Quaternion {
		const result = new Quaternion();
		Quaternion.FromRotationMatrixToRef(matrix, result);
		return result;
	}

	/**
	 * Updates the given quaternion with the given rotation matrix values
	 * @param matrix defines the source matrix
	 * @param result defines the target quaternion
	 */
	public static FromRotationMatrixToRef(matrix: Matrix, result: Quaternion): void {
		const data = matrix.m;
		const m11 = data[0], m12 = data[4], m13 = data[8];
		const m21 = data[1], m22 = data[5], m23 = data[9];
		const m31 = data[2], m32 = data[6], m33 = data[10];
		const trace = m11 + m22 + m33;
		let s;

		if (trace > 0) {

			s = 0.5 / Math.sqrt(trace + 1.0);

			result.w = 0.25 / s;
			result.x = (m32 - m23) * s;
			result.y = (m13 - m31) * s;
			result.z = (m21 - m12) * s;
		} else if (m11 > m22 && m11 > m33) {

			s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

			result.w = (m32 - m23) / s;
			result.x = 0.25 * s;
			result.y = (m12 + m21) / s;
			result.z = (m13 + m31) / s;
		} else if (m22 > m33) {

			s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

			result.w = (m13 - m31) / s;
			result.x = (m12 + m21) / s;
			result.y = 0.25 * s;
			result.z = (m23 + m32) / s;
		} else {

			s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

			result.w = (m21 - m12) / s;
			result.x = (m13 + m31) / s;
			result.y = (m23 + m32) / s;
			result.z = 0.25 * s;
		}
	}

	/**
	 * Calculates a rotation to face the `to` point from the `from` point.
	 * @param from The location of the viewpoint.
	 * @param to The location to face toward.
	 * @param offset (Optional) Offset yaw, pitch, roll to add.
	 */
	public static LookAt(from: Vector3, to: Vector3, offset = Vector3.Zero()) {
		const direction = to.subtract(from);
		const yaw = -Math.atan2(direction.z, direction.x) + Math.PI / 2;
		const len = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
		const pitch = -Math.atan2(direction.y, len);
		return Quaternion.RotationYawPitchRoll(yaw + offset.x, pitch + offset.y, + offset.z);
	}

	/**
	 * Returns the dot product (float) between the quaternions "left" and "right"
	 * @param left defines the left operand
	 * @param right defines the right operand
	 * @returns the dot product
	 */
	public static Dot(left: Quaternion, right: Quaternion): number {
		return (left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w);
	}

	/**
	 * Checks if the two quaternions are close to each other
	 * @param quat0 defines the first quaternion to check
	 * @param quat1 defines the second quaternion to check
	 * @returns true if the two quaternions are close to each other
	 */
	public static AreClose(quat0: Quaternion, quat1: Quaternion): boolean {
		const dot = Quaternion.Dot(quat0, quat1);

		return dot >= 0;
	}

	/**
	 * Creates an empty quaternion
	 * @returns a new quaternion set to (0.0, 0.0, 0.0)
	 */
	public static Zero(): Quaternion {
		return new Quaternion(0.0, 0.0, 0.0, 0.0);
	}

	/**
	 * Inverse a given quaternion
	 * @param q defines the source quaternion
	 * @returns a new quaternion as the inverted current quaternion
	 */
	public static Inverse(q: Quaternion): Quaternion {
		return new Quaternion(-q.x, -q.y, -q.z, q.w);
	}

	/**
	 * Inverse a given quaternion
	 * @param q defines the source quaternion
	 * @param result the quaternion the result will be stored in
	 * @returns the result quaternion
	 */
	public static InverseToRef(q: Quaternion, result: Quaternion): Quaternion {
		result.set(-q.x, -q.y, -q.z, q.w);
		return result;
	}

	/**
	 * Creates an identity quaternion
	 * @returns the identity quaternion
	 */
	public static Identity(): Quaternion {
		return new Quaternion(0.0, 0.0, 0.0, 1.0);
	}

	/**
	 * Gets a boolean indicating if the given quaternion is identity
	 * @param quaternion defines the quaternion to check
	 * @returns true if the quaternion is identity
	 */
	public static IsIdentity(quaternion: Quaternion): boolean {
		return quaternion && quaternion.x === 0 && quaternion.y === 0 && quaternion.z === 0 && quaternion.w === 1;
	}

	/**
	 * Creates a quaternion from a rotation around an axis
	 * @param axis defines the axis to use
	 * @param angle defines the angle to use
	 * @returns a new quaternion created from the given axis (Vector3) and angle in radians (float)
	 */
	public static RotationAxis(axis: Vector3, angle: number): Quaternion {
		return Quaternion.RotationAxisToRef(axis, angle, new Quaternion());
	}

	/**
	 * Creates a rotation around an axis and stores it into the given quaternion
	 * @param axis defines the axis to use
	 * @param angle defines the angle to use
	 * @param result defines the target quaternion
	 * @returns the target quaternion
	 */
	public static RotationAxisToRef(axis: Vector3, angle: number, result: Quaternion): Quaternion {
		const sin = Math.sin(angle / 2);
		axis.normalize();
		result.w = Math.cos(angle / 2);
		result.x = axis.x * sin;
		result.y = axis.y * sin;
		result.z = axis.z * sin;
		return result;
	}

	/**
	 * Creates a new quaternion from data stored into an array
	 * @param array defines the data source
	 * @param offset defines the offset in the source array where the data starts
	 * @returns a new quaternion
	 */
	public static FromArray(array: ArrayLike<number>, offset?: number): Quaternion {
		if (!offset) {
			offset = 0;
		}
		return new Quaternion(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
	}

	/**
	 * Create a quaternion from Euler rotation angles
	 * @param x Pitch
	 * @param y Yaw
	 * @param z Roll
	 * @returns the new Quaternion
	 */
	public static FromEulerAngles(x: number, y: number, z: number): Quaternion {
		const q = new Quaternion();
		Quaternion.RotationYawPitchRollToRef(y, x, z, q);
		return q;
	}

	/**
	 * Updates a quaternion from Euler rotation angles
	 * @param x Pitch
	 * @param y Yaw
	 * @param z Roll
	 * @param result the quaternion to store the result
	 * @returns the updated quaternion
	 */
	public static FromEulerAnglesToRef(x: number, y: number, z: number, result: Quaternion): Quaternion {
		Quaternion.RotationYawPitchRollToRef(y, x, z, result);
		return result;
	}

	/**
	 * Create a quaternion from Euler rotation vector
	 * @param vec the Euler vector (x Pitch, y Yaw, z Roll)
	 * @returns the new Quaternion
	 */
	public static FromEulerVector(vec: Vector3): Quaternion {
		const q = new Quaternion();
		Quaternion.RotationYawPitchRollToRef(vec.y, vec.x, vec.z, q);
		return q;
	}

	/**
	 * Updates a quaternion from Euler rotation vector
	 * @param vec the Euler vector (x Pitch, y Yaw, z Roll)
	 * @param result the quaternion to store the result
	 * @returns the updated quaternion
	 */
	public static FromEulerVectorToRef(vec: Vector3, result: Quaternion): Quaternion {
		Quaternion.RotationYawPitchRollToRef(vec.y, vec.x, vec.z, result);
		return result;
	}

	/**
	 * Creates a new quaternion from the given Euler float angles (y, x, z)
	 * @param yaw defines the rotation around Y axis
	 * @param pitch defines the rotation around X axis
	 * @param roll defines the rotation around Z axis
	 * @returns the new quaternion
	 */
	public static RotationYawPitchRoll(yaw: number, pitch: number, roll: number): Quaternion {
		const q = new Quaternion();
		Quaternion.RotationYawPitchRollToRef(yaw, pitch, roll, q);
		return q;
	}

	/**
	 * Creates a new rotation from the given Euler float angles (y, x, z) and stores it in the target quaternion
	 * @param yaw defines the rotation around Y axis
	 * @param pitch defines the rotation around X axis
	 * @param roll defines the rotation around Z axis
	 * @param result defines the target quaternion
	 */
	public static RotationYawPitchRollToRef(yaw: number, pitch: number, roll: number, result: Quaternion): void {
		// Produces a quaternion from Euler angles in the z-y-x orientation (Tait-Bryan angles)
		const halfRoll = roll * 0.5;
		const halfPitch = pitch * 0.5;
		const halfYaw = yaw * 0.5;

		const sinRoll = Math.sin(halfRoll);
		const cosRoll = Math.cos(halfRoll);
		const sinPitch = Math.sin(halfPitch);
		const cosPitch = Math.cos(halfPitch);
		const sinYaw = Math.sin(halfYaw);
		const cosYaw = Math.cos(halfYaw);

		result.x = (cosYaw * sinPitch * cosRoll) + (sinYaw * cosPitch * sinRoll);
		result.y = (sinYaw * cosPitch * cosRoll) - (cosYaw * sinPitch * sinRoll);
		result.z = (cosYaw * cosPitch * sinRoll) - (sinYaw * sinPitch * cosRoll);
		result.w = (cosYaw * cosPitch * cosRoll) + (sinYaw * sinPitch * sinRoll);
	}

	/**
	 * Creates a new quaternion from the given Euler float angles expressed in z-x-z orientation
	 * @param alpha defines the rotation around first axis
	 * @param beta defines the rotation around second axis
	 * @param gamma defines the rotation around third axis
	 * @returns the new quaternion
	 */
	public static RotationAlphaBetaGamma(alpha: number, beta: number, gamma: number): Quaternion {
		const result = new Quaternion();
		Quaternion.RotationAlphaBetaGammaToRef(alpha, beta, gamma, result);
		return result;
	}

	/**
	 * Creates a new quaternion from the given Euler float angles expressed
	 * in z-x-z orientation and stores it in the target quaternion
	 * @param alpha defines the rotation around first axis
	 * @param beta defines the rotation around second axis
	 * @param gamma defines the rotation around third axis
	 * @param result defines the target quaternion
	 */
	public static RotationAlphaBetaGammaToRef(alpha: number, beta: number, gamma: number, result: Quaternion): void {
		// Produces a quaternion from Euler angles in the z-x-z orientation
		const halfGammaPlusAlpha = (gamma + alpha) * 0.5;
		const halfGammaMinusAlpha = (gamma - alpha) * 0.5;
		const halfBeta = beta * 0.5;

		result.x = Math.cos(halfGammaMinusAlpha) * Math.sin(halfBeta);
		result.y = Math.sin(halfGammaMinusAlpha) * Math.sin(halfBeta);
		result.z = Math.sin(halfGammaPlusAlpha) * Math.cos(halfBeta);
		result.w = Math.cos(halfGammaPlusAlpha) * Math.cos(halfBeta);
	}

	/**
	 * Creates a new quaternion containing the rotation value to reach the target
	 * (axis1, axis2, axis3) orientation as a rotated XYZ system (axis1, axis2 and
	 * axis3 are normalized during this operation)
	 * @param axis1 defines the first axis
	 * @param axis2 defines the second axis
	 * @param axis3 defines the third axis
	 * @returns the new quaternion
	 */
	public static RotationQuaternionFromAxis(axis1: Vector3, axis2: Vector3, axis3: Vector3): Quaternion {
		const quat = new Quaternion(0.0, 0.0, 0.0, 0.0);
		Quaternion.RotationQuaternionFromAxisToRef(axis1, axis2, axis3, quat);
		return quat;
	}

	/**
	 * Creates a rotation value to reach the target (axis1, axis2, axis3) orientation
	 * as a rotated XYZ system (axis1, axis2 and axis3 are normalized during this
	 * operation) and stores it in the target quaternion
	 * @param axis1 defines the first axis
	 * @param axis2 defines the second axis
	 * @param axis3 defines the third axis
	 * @param ref defines the target quaternion
	 */
	public static RotationQuaternionFromAxisToRef(
		axis1: Vector3,
		axis2: Vector3,
		axis3: Vector3,
		ref: Quaternion): void {
		const rotMat = MathTmp.Matrix[0];
		Matrix.FromXYZAxesToRef(axis1.normalize(), axis2.normalize(), axis3.normalize(), rotMat);
		Quaternion.FromRotationMatrixToRef(rotMat, ref);
	}

	/**
	 * Interpolates between two quaternions
	 * @param left defines first quaternion
	 * @param right defines second quaternion
	 * @param amount defines the gradient to use
	 * @returns the new interpolated quaternion
	 */
	public static Slerp(left: Quaternion, right: Quaternion, amount: number): Quaternion {
		const result = Quaternion.Identity();

		Quaternion.SlerpToRef(left, right, amount, result);

		return result;
	}

	/**
	 * Interpolates between two quaternions and stores it into a target quaternion
	 * @param left defines first quaternion
	 * @param right defines second quaternion
	 * @param amount defines the gradient to use
	 * @param result defines the target quaternion
	 */
	public static SlerpToRef(left: Quaternion, right: Quaternion, amount: number, result: Quaternion): void {
		let num2;
		let num3;
		let num4 = (((left.x * right.x) + (left.y * right.y)) + (left.z * right.z)) + (left.w * right.w);
		let flag = false;

		if (num4 < 0) {
			flag = true;
			num4 = -num4;
		}

		if (num4 > 0.999999) {
			num3 = 1 - amount;
			num2 = flag ? -amount : amount;
		} else {
			const num5 = Math.acos(num4);
			const num6 = (1.0 / Math.sin(num5));
			num3 = (Math.sin((1.0 - amount) * num5)) * num6;
			num2 = flag ? ((-Math.sin(amount * num5)) * num6) : ((Math.sin(amount * num5)) * num6);
		}

		result.x = (num3 * left.x) + (num2 * right.x);
		result.y = (num3 * left.y) + (num2 * right.y);
		result.z = (num3 * left.z) + (num2 * right.z);
		result.w = (num3 * left.w) + (num2 * right.w);
	}

	/**
	 * Interpolate between two quaternions using Hermite interpolation
	 * @param value1 defines first quaternion
	 * @param tangent1 defines the incoming tangent
	 * @param value2 defines second quaternion
	 * @param tangent2 defines the outgoing tangent
	 * @param amount defines the target quaternion
	 * @returns the new interpolated quaternion
	 */
	public static Hermite(
		value1: Quaternion,
		tangent1: Quaternion,
		value2: Quaternion,
		tangent2: Quaternion,
		amount: number): Quaternion {
		const squared = amount * amount;
		const cubed = amount * squared;
		const part1 = ((2.0 * cubed) - (3.0 * squared)) + 1.0;
		const part2 = (-2.0 * cubed) + (3.0 * squared);
		const part3 = (cubed - (2.0 * squared)) + amount;
		const part4 = cubed - squared;

		const x = (((value1.x * part1) + (value2.x * part2)) + (tangent1.x * part3)) + (tangent2.x * part4);
		const y = (((value1.y * part1) + (value2.y * part2)) + (tangent1.y * part3)) + (tangent2.y * part4);
		const z = (((value1.z * part1) + (value2.z * part2)) + (tangent1.z * part3)) + (tangent2.z * part4);
		const w = (((value1.w * part1) + (value2.w * part2)) + (tangent1.w * part3)) + (tangent2.w * part4);
		return new Quaternion(x, y, z, w);
	}
}
