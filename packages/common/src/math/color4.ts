/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Color3, Scalar, ToGammaSpace, ToLinearSpace } from '.';

export interface Color4Like {
	r: number;
	g: number;
	b: number;
	a: number;
}

/**
 * Class used to hold a RBGA color
 */
export class Color4 {
	/**
	 * Creates a new Color4 object from red, green, blue values, all between 0 and 1
	 * @param r defines the red component (between 0 and 1, default is 0)
	 * @param g defines the green component (between 0 and 1, default is 0)
	 * @param b defines the blue component (between 0 and 1, default is 0)
	 * @param a defines the alpha component (between 0 and 1, default is 1)
	 */
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
		public b = 0,
		/**
		 * Defines the alpha component (between 0 and 1, default is 1)
		 */
		public a = 1) {
	}

	// Operators

	/**
	 * Adds in place the given Color4 values to the current Color4 object
	 * @param right defines the second operand
	 * @returns the current updated Color4 object
	 */
	public addInPlace(right: Color4): Color4 {
		this.r += right.r;
		this.g += right.g;
		this.b += right.b;
		this.a += right.a;
		return this;
	}

	/**
	 * Creates a new array populated with 4 numeric elements : red, green, blue, alpha values
	 * @returns the new array
	 */
	public asArray(): number[] {
		const result = new Array<number>();
		this.toArray(result, 0);
		return result;
	}

	/**
	 * Stores from the starting index in the given array the Color4 successive values
	 * @param array defines the array where to store the r,g,b components
	 * @param index defines an optional index in the target array to define where to start storing values
	 * @returns the current Color4 object
	 */
	public toArray(array: number[], index = 0): Color4 {
		array[index] = this.r;
		array[index + 1] = this.g;
		array[index + 2] = this.b;
		array[index + 3] = this.a;
		return this;
	}

	/**
	 * Creates a new Color4 set with the added values of the current Color4 and of the given one
	 * @param right defines the second operand
	 * @returns a new Color4 object
	 */
	public add(right: Color4): Color4 {
		return new Color4(this.r + right.r, this.g + right.g, this.b + right.b, this.a + right.a);
	}

	/**
	 * Creates a new Color4 set with the subtracted values of the given one from the current Color4
	 * @param right defines the second operand
	 * @returns a new Color4 object
	 */
	public subtract(right: Color4): Color4 {
		return new Color4(this.r - right.r, this.g - right.g, this.b - right.b, this.a - right.a);
	}

	/**
	 * Subtracts the given ones from the current Color4 values and stores the results in "result"
	 * @param right defines the second operand
	 * @param result defines the Color4 object where to store the result
	 * @returns the current Color4 object
	 */
	public subtractToRef(right: Color4, result: Color4): Color4 {
		result.r = this.r - right.r;
		result.g = this.g - right.g;
		result.b = this.b - right.b;
		result.a = this.a - right.a;
		return this;
	}

	/**
	 * Creates a new Color4 with the current Color4 values multiplied by scale
	 * @param scale defines the scaling factor to apply
	 * @returns a new Color4 object
	 */
	public scale(scale: number): Color4 {
		return new Color4(this.r * scale, this.g * scale, this.b * scale, this.a * scale);
	}

	/**
	 * Multiplies the current Color4 values by scale and stores the result in "result"
	 * @param scale defines the scaling factor to apply
	 * @param result defines the Color4 object where to store the result
	 * @returns the current unmodified Color4
	 */
	public scaleToRef(scale: number, result: Color4): Color4 {
		result.r = this.r * scale;
		result.g = this.g * scale;
		result.b = this.b * scale;
		result.a = this.a * scale;
		return this;
	}

	/**
	 * Scale the current Color4 values by a factor and add the result to a given Color4
	 * @param scale defines the scale factor
	 * @param result defines the Color4 object where to store the result
	 * @returns the unmodified current Color4
	 */
	public scaleAndAddToRef(scale: number, result: Color4): Color4 {
		result.r += this.r * scale;
		result.g += this.g * scale;
		result.b += this.b * scale;
		result.a += this.a * scale;
		return this;
	}

	/**
	 * Clamps the rgb values by the min and max values and stores the result into "result"
	 * @param min defines minimum clamping value (default is 0)
	 * @param max defines maximum clamping value (default is 1)
	 * @param result defines color to store the result into.
	 * @returns the cuurent Color4
	 */
	public clampToRef(min = 0, max = 1, result: Color4): Color4 {
		result.r = Scalar.Clamp(this.r, min, max);
		result.g = Scalar.Clamp(this.g, min, max);
		result.b = Scalar.Clamp(this.b, min, max);
		result.a = Scalar.Clamp(this.a, min, max);
		return this;
	}

	/**
	 * Multipy an Color4 value by another and return a new Color4 object
	 * @param color defines the Color4 value to multiply by
	 * @returns a new Color4 object
	 */
	public multiply(color: Color4): Color4 {
		return new Color4(this.r * color.r, this.g * color.g, this.b * color.b, this.a * color.a);
	}

	/**
	 * Multipy a Color4 value by another and push the result in a reference value
	 * @param color defines the Color4 value to multiply by
	 * @param result defines the Color4 to fill the result in
	 * @returns the result Color4
	 */
	public multiplyToRef(color: Color4, result: Color4): Color4 {
		result.r = this.r * color.r;
		result.g = this.g * color.g;
		result.b = this.b * color.b;
		result.a = this.a * color.a;
		return result;
	}

	/**
	 * Creates a string with the Color4 current values
	 * @returns the string representation of the Color4 object
	 */
	public toString(): string {
		return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
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
			a: this.a,
		} as Color4Like;
	}

	/**
	 * Returns the string "Color4"
	 * @returns "Color4"
	 */
	public getClassName(): string {
		return "Color4";
	}

	/**
	 * Compute the Color4 hash code
	 * @returns an unique number that can be used to hash Color4 objects
	 */
	public getHashCode(): number {
		let hash = this.r || 0;
		hash = (hash * 397) ^ (this.g || 0);
		hash = (hash * 397) ^ (this.b || 0);
		hash = (hash * 397) ^ (this.a || 0);
		return hash;
	}

	/**
	 * Creates a new Color4 copied from the current one
	 * @returns a new Color4 object
	 */
	public clone(): Color4 {
		return new Color4(this.r, this.g, this.b, this.a);
	}

	/**
	 * Copies the given Color4 values into the current one
	 * @param source defines the source Color4 object
	 * @returns the current updated Color4 object
	 */
	public copyFrom(source: Color4): Color4 {
		this.r = source.r;
		this.g = source.g;
		this.b = source.b;
		this.a = source.a;
		return this;
	}

	/**
	 * Copies the given float values into the current one
	 * @param r defines the red component to read from
	 * @param g defines the green component to read from
	 * @param b defines the blue component to read from
	 * @param a defines the alpha component to read from
	 * @returns the current updated Color4 object
	 */
	public copyFromFloats(r: number, g: number, b: number, a: number): Color4 {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		return this;
	}

	/**
	 * Copies the given float values into the current one
	 * @param r defines the red component to read from
	 * @param g defines the green component to read from
	 * @param b defines the blue component to read from
	 * @param a defines the alpha component to read from
	 * @returns the current updated Color4 object
	 */
	public set(r: number, g: number, b: number, a: number): Color4 {
		return this.copyFromFloats(r, g, b, a);
	}

	/**
	 * Updates the Color4 from the sparsely populated value.
	 * @param from The sparsely populated value to read from.
	 */
	public copy(from: Partial<Color4Like>): this {
		if (!from) return this;
		if (from.r !== undefined) this.r = from.r;
		if (from.g !== undefined) this.g = from.g;
		if (from.b !== undefined) this.b = from.b;
		if (from.a !== undefined) this.a = from.a;
		return this;
	}

	/**
	 * Compute the Color4 hexadecimal code as a string
	 * @returns a string containing the hexadecimal representation of the Color4 object
	 */
	public toHexString(): string {
		const intR = (this.r * 255) || 0;
		const intG = (this.g * 255) || 0;
		const intB = (this.b * 255) || 0;
		const intA = (this.a * 255) || 0;
		return "#" + Scalar.ToHex(intR) + Scalar.ToHex(intG) + Scalar.ToHex(intB) + Scalar.ToHex(intA);
	}

	/**
	 * Computes a new Color4 converted from the current one to linear space
	 * @returns a new Color4 object
	 */
	public toLinearSpace(): Color4 {
		const convertedColor = new Color4();
		this.toLinearSpaceToRef(convertedColor);
		return convertedColor;
	}

	/**
	 * Converts the Color4 values to linear space and stores the result in "convertedColor"
	 * @param convertedColor defines the Color4 object where to store the linear space version
	 * @returns the unmodified Color4
	 */
	public toLinearSpaceToRef(convertedColor: Color4): Color4 {
		convertedColor.r = Math.pow(this.r, ToLinearSpace);
		convertedColor.g = Math.pow(this.g, ToLinearSpace);
		convertedColor.b = Math.pow(this.b, ToLinearSpace);
		convertedColor.a = this.a;
		return this;
	}

	/**
	 * Computes a new Color4 converted from the current one to gamma space
	 * @returns a new Color4 object
	 */
	public toGammaSpace(): Color4 {
		const convertedColor = new Color4();
		this.toGammaSpaceToRef(convertedColor);
		return convertedColor;
	}

	/**
	 * Converts the Color4 values to gamma space and stores the result in "convertedColor"
	 * @param convertedColor defines the Color4 object where to store the gamma space version
	 * @returns the unmodified Color4
	 */
	public toGammaSpaceToRef(convertedColor: Color4): Color4 {
		convertedColor.r = Math.pow(this.r, ToGammaSpace);
		convertedColor.g = Math.pow(this.g, ToGammaSpace);
		convertedColor.b = Math.pow(this.b, ToGammaSpace);
		convertedColor.a = this.a;
		return this;
	}

	// Statics

	/**
	 * Creates a new Color4 from the string containing valid hexadecimal values
	 * @param hex defines a string containing valid hexadecimal values
	 * @returns a new Color4 object
	 */
	public static FromHexString(hex: string): Color4 {
		if (hex.substring(0, 1) !== "#" || hex.length !== 9) {
			return new Color4(0.0, 0.0, 0.0, 0.0);
		}

		const r = parseInt(hex.substring(1, 3), 16);
		const g = parseInt(hex.substring(3, 5), 16);
		const b = parseInt(hex.substring(5, 7), 16);
		const a = parseInt(hex.substring(7, 9), 16);

		return Color4.FromInts(r, g, b, a);
	}

	/**
	 * Creates a new Color4 object set with the linearly interpolated values of "amount"
	 * between the left Color4 object and the right Color4 object
	 * @param left defines the start value
	 * @param right defines the end value
	 * @param amount defines the gradient factor
	 * @returns a new Color4 object
	 */
	public static Lerp(left: Color4, right: Color4, amount: number): Color4 {
		const result = new Color4(0.0, 0.0, 0.0, 0.0);
		Color4.LerpToRef(left, right, amount, result);
		return result;
	}

	/**
	 * Set the given "result" with the linearly interpolated values of "amount" between the left
	 * Color4 object and the right Color4 object
	 * @param left defines the start value
	 * @param right defines the end value
	 * @param amount defines the gradient factor
	 * @param result defines the Color4 object where to store data
	 */
	public static LerpToRef(left: Color4, right: Color4, amount: number, result: Color4): void {
		result.r = left.r + (right.r - left.r) * amount;
		result.g = left.g + (right.g - left.g) * amount;
		result.b = left.b + (right.b - left.b) * amount;
		result.a = left.a + (right.a - left.a) * amount;
	}

	/**
	 * Creates a new Color4 from a Color3 and an alpha value
	 * @param color3 defines the source Color3 to read from
	 * @param alpha defines the alpha component (1.0 by default)
	 * @returns a new Color4 object
	 */
	public static FromColor3(color3: Color3, alpha = 1.0): Color4 {
		return new Color4(color3.r, color3.g, color3.b, alpha);
	}

	/**
	 * Creates a new Color4 from the starting index element of the given array
	 * @param array defines the source array to read from
	 * @param offset defines the offset in the source array
	 * @returns a new Color4 object
	 */
	public static FromArray(array: ArrayLike<number>, offset = 0): Color4 {
		return new Color4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
	}

	/**
	 * Creates a new Color3 from integer values (< 256)
	 * @param r defines the red component to read from (value between 0 and 255)
	 * @param g defines the green component to read from (value between 0 and 255)
	 * @param b defines the blue component to read from (value between 0 and 255)
	 * @param a defines the alpha component to read from (value between 0 and 255)
	 * @returns a new Color3 object
	 */
	public static FromInts(r: number, g: number, b: number, a: number): Color4 {
		return new Color4(r / 255.0, g / 255.0, b / 255.0, a / 255.0);
	}

	/**
	 * Check the content of a given array and convert it to an array containing RGBA data
	 * If the original array was already containing count * 4 values then it is returned directly
	 * @param colors defines the array to check
	 * @param count defines the number of RGBA data to expect
	 * @returns an array containing count * 4 values (RGBA)
	 */
	public static CheckColors4(colors: number[], count: number): number[] {
		// Check if color3 was used
		if (colors.length === count * 3) {
			const colors4 = [];
			for (let index = 0; index < colors.length; index += 3) {
				const newIndex = (index / 3) * 4;
				colors4[newIndex] = colors[index];
				colors4[newIndex + 1] = colors[index + 1];
				colors4[newIndex + 2] = colors[index + 2];
				colors4[newIndex + 3] = 1.0;
			}

			return colors4;
		}

		return colors;
	}
}
