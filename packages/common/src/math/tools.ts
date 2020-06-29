/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export default class Tools {
	/**
	 * Returns an array of the given size filled with element built from the given constructor and the paramters
	 * @param size the number of element to construct and put in the array
	 * @param itemBuilder a callback responsible for creating new instance of item. Called once per array entry.
	 * @returns a new array filled with new objects
	 */
	public static BuildArray<T>(size: number, itemBuilder: () => T): T[] {
		const a: T[] = [];
		for (let i = 0; i < size; ++i) {
			a.push(itemBuilder());
		}
		return a;
	}
}
