/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Vector2 } from '.';

// tslint:disable:variable-name member-ordering

/**
 * Defines angle representation
 */
export class Angle {

	/**
	 * Creates an Angle object of "radians" radians (float).
	 */
	constructor(private _radians: number) {
		if (this._radians < 0.0) { this._radians += (2.0 * Math.PI); }
	}

	/**
	 * Get value in degrees
	 * @returns the Angle value in degrees (float)
	 */
	public degrees() {
		return this._radians * 180.0 / Math.PI;
	}

	/**
	 * Get value in radians
	 * @returns the Angle value in radians (float)
	 */
	public radians() {
		return this._radians;
	}

	/**
	 * Gets a new Angle object valued with the angle value in radians between the two given vectors
	 * @param a defines first vector
	 * @param b defines second vector
	 * @returns a new Angle
	 */
	public static BetweenTwoPoints(a: Vector2, b: Vector2): Angle {
		const delta = b.subtract(a);
		const theta = Math.atan2(delta.y, delta.x);
		return new Angle(theta);
	}

	/**
	 * Gets a new Angle object from the given float in radians
	 * @param radians defines the angle value in radians
	 * @returns a new Angle
	 */
	public static FromRadians(radians: number): Angle {
		return new Angle(radians);
	}
	/**
	 * Gets a new Angle object from the given float in degrees
	 * @param degrees defines the angle value in degrees
	 * @returns a new Angle
	 */
	public static FromDegrees(degrees: number): Angle {
		return new Angle(degrees * Math.PI / 180.0);
	}
}
