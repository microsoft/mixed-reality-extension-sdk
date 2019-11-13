/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable curly */

import { Color4, Scalar, ToGammaSpace, ToLinearSpace } from '.';
import { FloatArray } from './types';

export interface Color3Like {
	r: number;
	g: number;
	b: number;
}

/**
 * Class used to hold a RBG color
 */
export class Color3 implements Color3Like {

	/**
	 * Creates a new Color3 object from red, green, blue values, all between 0 and 1
	 * @param r defines the red component (between 0 and 1, default is 0)
	 * @param g defines the green component (between 0 and 1, default is 0)
	 * @param b defines the blue component (between 0 and 1, default is 0)
	 */
	// tslint:disable:variable-name
	constructor(
		/**
		 * Defines the red component (between 0 and 1, default is 0)
		 */
		public r = 0,
		/**
		 * Defines the green component (between 0 and 1, default is 0)
		 */
		public g = 0,
		/**
		 * Defines the blue component (between 0 and 1, default is 0)
		 */
		public b = 0) {
	}
	// tslint:enable:variable-name

	/**
	 * Creates a string with the Color3 current values
	 * @returns the string representation of the Color3 object
	 */
	public toString(): string {
		return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
	}

	/**
	 * Returns a JSON representation of this color. This is necessary due to the way
	 * Actors detect changes on components like the actor's transform. They do this by adding
	 * properties for observation, and we don't want these properties serialized.
	 */
	public toJSON() {
		return {
			r: this.r,
			g: this.g,
			b: this.b,
		} as Color3Like;
	}

	/**
	 * Returns the string "Color3"
	 * @returns "Color3"
	 */
	public getClassName(): string {
		return "Color3";
	}

	/**
	 * Compute the Color3 hash code
	 * @returns an unique number that can be used to hash Color3 objects
	 */
	public getHashCode(): number {
		let hash = this.r || 0;
		// tslint:disable:no-bitwise
		hash = (hash * 397) ^ (this.g || 0);
		hash = (hash * 397) ^ (this.b || 0);
		// tslint:enable:no-bitwise
		return hash;
	}

	// Operators

	/**
	 * Stores in the given array from the given starting index the red, green, blue values as successive elements
	 * @param array defines the array where to store the r,g,b components
	 * @param index defines an optional index in the target array to define where to start storing values
	 * @returns the current Color3 object
	 */
	public toArray(array: FloatArray, index = 0): Color3 {
		array[index] = this.r;
		array[index + 1] = this.g;
		array[index + 2] = this.b;

		return this;
	}

	public copyFromArray(arr: FloatArray, index = 0): this {
		this.r = arr[index];
		this.g = arr[index + 1];
		this.b = arr[index + 2];
		return this;
	}

	/**
	 * Returns a new Color4 object from the current Color3 and the given alpha
	 * @param alpha defines the alpha component on the new Color4 object (default is 1)
	 * @returns a new Color4 object
	 */
	public toColor4(alpha = 1): Color4 {
		return new Color4(this.r, this.g, this.b, alpha);
	}

	/**
	 * Returns a new array populated with 3 numeric elements : red, green and blue values
	 * @returns the new array
	 */
	public asArray(): number[] {
		const result = new Array<number>();
		this.toArray(result, 0);
		return result;
	}

	/**
	 * Returns the luminance value
	 * @returns a float value
	 */
	public toLuminance(): number {
		return this.r * 0.3 + this.g * 0.59 + this.b * 0.11;
	}

	/**
	 * Multiply each Color3 rgb values by the given Color3 rgb values in a new Color3 object
	 * @param otherColor defines the second operand
	 * @returns the new Color3 object
	 */
	public multiply(otherColor: Color3): Color3 {
		return new Color3(this.r * otherColor.r, this.g * otherColor.g, this.b * otherColor.b);
	}

	/**
	 * Multiply the rgb values of the Color3 and the given Color3 and stores the result in the object "result"
	 * @param otherColor defines the second operand
	 * @param result defines the Color3 object where to store the result
	 * @returns the current Color3
	 */
	public multiplyToRef(otherColor: Color3, result: Color3): Color3 {
		result.r = this.r * otherColor.r;
		result.g = this.g * otherColor.g;
		result.b = this.b * otherColor.b;
		return this;
	}

	/**
	 * Determines equality between Color3 objects
	 * @param otherColor defines the second operand
	 * @returns true if the rgb values are equal to the given ones
	 */
	public equals(otherColor: Partial<Color3>): boolean {
		return otherColor && this.r === otherColor.r && this.g === otherColor.g && this.b === otherColor.b;
	}

	/**
	 * Determines equality between the current Color3 object and a set of r,b,g values
	 * @param r defines the red component to check
	 * @param g defines the green component to check
	 * @param b defines the blue component to check
	 * @returns true if the rgb values are equal to the given ones
	 */
	public equalsFloats(r: number, g: number, b: number): boolean {
		return this.r === r && this.g === g && this.b === b;
	}

	/**
	 * Multiplies in place each rgb value by scale
	 * @param scale defines the scaling factor
	 * @returns the updated Color3
	 */
	public scale(scale: number): Color3 {
		return new Color3(this.r * scale, this.g * scale, this.b * scale);
	}

	/**
	 * Multiplies the rgb values by scale and stores the result into "result"
	 * @param scale defines the scaling factor
	 * @param result defines the Color3 object where to store the result
	 * @returns the unmodified current Color3
	 */
	public scaleToRef(scale: number, result: Color3): Color3 {
		result.r = this.r * scale;
		result.g = this.g * scale;
		result.b = this.b * scale;
		return this;
	}

	/**
	 * Scale the current Color3 values by a factor and add the result to a given Color3
	 * @param scale defines the scale factor
	 * @param result defines color to store the result into
	 * @returns the unmodified current Color3
	 */
	public scaleAndAddToRef(scale: number, result: Color3): Color3 {
		result.r += this.r * scale;
		result.g += this.g * scale;
		result.b += this.b * scale;
		return this;
	}

	/**
	 * Clamps the rgb values by the min and max values and stores the result into "result"
	 * @param min defines minimum clamping value (default is 0)
	 * @param max defines maximum clamping value (default is 1)
	 * @param result defines color to store the result into
	 * @returns the original Color3
	 */
	public clampToRef(min = 0, max = 1, result: Color3): Color3 {
		result.r = Scalar.Clamp(this.r, min, max);
		result.g = Scalar.Clamp(this.g, min, max);
		result.b = Scalar.Clamp(this.b, min, max);
		return this;
	}

	/**
	 * Creates a new Color3 set with the added values of the current Color3 and of the given one
	 * @param otherColor defines the second operand
	 * @returns the new Color3
	 */
	public add(otherColor: Color3): Color3 {
		return new Color3(this.r + otherColor.r, this.g + otherColor.g, this.b + otherColor.b);
	}

	/**
	 * Stores the result of the addition of the current Color3 and given one rgb values into "result"
	 * @param otherColor defines the second operand
	 * @param result defines Color3 object to store the result into
	 * @returns the unmodified current Color3
	 */
	public addToRef(otherColor: Color3, result: Color3): Color3 {
		result.r = this.r + otherColor.r;
		result.g = this.g + otherColor.g;
		result.b = this.b + otherColor.b;
		return this;
	}

	/**
	 * Returns a new Color3 set with the subtracted values of the given one from the current Color3
	 * @param otherColor defines the second operand
	 * @returns the new Color3
	 */
	public subtract(otherColor: Color3): Color3 {
		return new Color3(this.r - otherColor.r, this.g - otherColor.g, this.b - otherColor.b);
	}

	/**
	 * Stores the result of the subtraction of given one from the current Color3 rgb values into "result"
	 * @param otherColor defines the second operand
	 * @param result defines Color3 object to store the result into
	 * @returns the unmodified current Color3
	 */
	public subtractToRef(otherColor: Color3, result: Color3): Color3 {
		result.r = this.r - otherColor.r;
		result.g = this.g - otherColor.g;
		result.b = this.b - otherColor.b;
		return this;
	}

	/**
	 * Copy the current object
	 * @returns a new Color3 copied the current one
	 */
	public clone(): Color3 {
		return new Color3(this.r, this.g, this.b);
	}

	/**
	 * Copies the rgb values from the source in the current Color3
	 * @param source defines the source Color3 object
	 * @returns the updated Color3 object
	 */
	public copyFrom(source: Color3): Color3 {
		this.r = source.r;
		this.g = source.g;
		this.b = source.b;
		return this;
	}

	/**
	 * Updates the Color3 rgb values from the given floats
	 * @param r defines the red component to read from
	 * @param g defines the green component to read from
	 * @param b defines the blue component to read from
	 * @returns the current Color3 object
	 */
	public copyFromFloats(r: number, g: number, b: number): Color3 {
		this.r = r;
		this.g = g;
		this.b = b;
		return this;
	}

	/**
	 * Updates the Color3 rgb values from the given floats
	 * @param r defines the red component to read from
	 * @param g defines the green component to read from
	 * @param b defines the blue component to read from
	 * @returns the current Color3 object
	 */
	public set(r: number, g: number, b: number): Color3 {
		return this.copyFromFloats(r, g, b);
	}

	/**
	 * Updates the Color3 from the sparsely populated value.
	 * @param from The sparsely populated value to read from.
	 */
	public copy(from: Partial<Color3Like>): this {
		if (!from) return this;
		if (from.r !== undefined) this.r = from.r;
		if (from.g !== undefined) this.g = from.g;
		if (from.b !== undefined) this.b = from.b;
		return this;
	}

	/**
	 * Compute the Color3 hexadecimal code as a string
	 * @returns a string containing the hexadecimal representation of the Color3 object
	 */
	public toHexString(): string {
		const intR = (this.r * 255) || 0;
		const intG = (this.g * 255) || 0;
		const intB = (this.b * 255) || 0;
		return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB);
	}

	/**
	 * Computes a new Color3 converted from the current one to linear space
	 * @returns a new Color3 object
	 */
	public toLinearSpace(): Color3 {
		const convertedColor = new Color3();
		this.toLinearSpaceToRef(convertedColor);
		return convertedColor;
	}

	/**
	 * Converts the Color3 values to linear space and stores the result in "convertedColor"
	 * @param convertedColor defines the Color3 object where to store the linear space version
	 * @returns the unmodified Color3
	 */
	public toLinearSpaceToRef(convertedColor: Color3): Color3 {
		convertedColor.r = Math.pow(this.r, ToLinearSpace);
		convertedColor.g = Math.pow(this.g, ToLinearSpace);
		convertedColor.b = Math.pow(this.b, ToLinearSpace);
		return this;
	}

	/**
	 * Computes a new Color3 converted from the current one to gamma space
	 * @returns a new Color3 object
	 */
	public toGammaSpace(): Color3 {
		const convertedColor = new Color3();
		this.toGammaSpaceToRef(convertedColor);
		return convertedColor;
	}

	/**
	 * Converts the Color3 values to gamma space and stores the result in "convertedColor"
	 * @param convertedColor defines the Color3 object where to store the gamma space version
	 * @returns the unmodified Color3
	 */
	public toGammaSpaceToRef(convertedColor: Color3): Color3 {
		convertedColor.r = Math.pow(this.r, ToGammaSpace);
		convertedColor.g = Math.pow(this.g, ToGammaSpace);
		convertedColor.b = Math.pow(this.b, ToGammaSpace);
		return this;
	}

	// Statics

	/**
	 * Creates a new Color3 from the string containing valid hexadecimal values
	 * @param hex defines a string containing valid hexadecimal values
	 * @returns a new Color3 object
	 */
	public static FromHexString(hex: string): Color3 {
		if (hex.substring(0, 1) !== "#" || hex.length !== 7) {
			return new Color3(0, 0, 0);
		}

		// tslint:disable:ban
		const r = parseInt(hex.substring(1, 3), 16);
		const g = parseInt(hex.substring(3, 5), 16);
		const b = parseInt(hex.substring(5, 7), 16);
		// tslint:enable:ban

		return Color3.FromInts(r, g, b);
	}

	/**
	 * Creates a new Vector3 from the starting index of the given array
	 * @param array defines the source array
	 * @param offset defines an offset in the source array
	 * @returns a new Color3 object
	 */
	public static FromArray(array: ArrayLike<number>, offset = 0): Color3 {
		return new Color3(array[offset], array[offset + 1], array[offset + 2]);
	}

	/**
	 * Creates a new Color3 from integer values (< 256)
	 * @param r defines the red component to read from (value between 0 and 255)
	 * @param g defines the green component to read from (value between 0 and 255)
	 * @param b defines the blue component to read from (value between 0 and 255)
	 * @returns a new Color3 object
	 */
	public static FromInts(r: number, g: number, b: number): Color3 {
		return new Color3(r / 255.0, g / 255.0, b / 255.0);
	}

	/**
	 * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
	 * @param start defines the start Color3 value
	 * @param end defines the end Color3 value
	 * @param amount defines the gradient value between start and end
	 * @returns a new Color3 object
	 */
	public static Lerp(start: Color3, end: Color3, amount: number): Color3 {
		const result = new Color3(0.0, 0.0, 0.0);
		Color3.LerpToRef(start, end, amount, result);
		return result;
	}

	/**
	 * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3
	 * @param left defines the start value
	 * @param right defines the end value
	 * @param amount defines the gradient factor
	 * @param result defines the Color3 object where to store the result
	 */
	public static LerpToRef(left: Color3, right: Color3, amount: number, result: Color3): void {
		result.r = left.r + ((right.r - left.r) * amount);
		result.g = left.g + ((right.g - left.g) * amount);
		result.b = left.b + ((right.b - left.b) * amount);
	}

	/**
	 * Returns a Color3 value containing a red color
	 * @returns a new Color3 object
	 */
	public static Red(): Color3 { return new Color3(1, 0, 0); }
	/**
	 * Returns a Color3 value containing a green color
	 * @returns a new Color3 object
	 */
	public static Green(): Color3 { return new Color3(0, 1, 0); }
	/**
	 * Returns a Color3 value containing a blue color
	 * @returns a new Color3 object
	 */
	public static Blue(): Color3 { return new Color3(0, 0, 1); }
	/**
	 * Returns a Color3 value containing a black color
	 * @returns a new Color3 object
	 */
	public static Black(): Color3 { return new Color3(0, 0, 0); }
	/**
	 * Returns a Color3 value containing a white color
	 * @returns a new Color3 object
	 */
	public static White(): Color3 { return new Color3(1, 1, 1); }
	/**
	 * Returns a Color3 value containing a purple color
	 * @returns a new Color3 object
	 */
	public static Purple(): Color3 { return new Color3(0.5, 0, 0.5); }
	/**
	 * Returns a Color3 value containing a magenta color
	 * @returns a new Color3 object
	 */
	public static Magenta(): Color3 { return new Color3(1, 0, 1); }
	/**
	 * Returns a Color3 value containing a yellow color
	 * @returns a new Color3 object
	 */
	public static Yellow(): Color3 { return new Color3(1, 1, 0); }
	/**
	 * Returns a Color3 value containing a gray color
	 * @returns a new Color3 object
	 */
	public static Gray(): Color3 { return new Color3(0.5, 0.5, 0.5); }
	/**
	 * Returns a Color3 value containing a light gray color
	 * @returns a new Color3 object
	 */
	public static LightGray(): Color3 { return new Color3(0.75, 0.75, 0.75); }
	/**
	 * Returns a Color3 value containing a dark gray color
	 * @returns a new Color3 object
	 */
	public static DarkGray(): Color3 { return new Color3(0.25, 0.25, 0.25); }
	/**
	 * Returns a Color3 value containing a teal color
	 * @returns a new Color3 object
	 */
	public static Teal(): Color3 { return new Color3(0, 1.0, 1.0); }
	/**
	 * Returns a Color3 value containing a random color
	 * @returns a new Color3 object
	 */
	public static Random(): Color3 { return new Color3(Math.random(), Math.random(), Math.random()); }
}
