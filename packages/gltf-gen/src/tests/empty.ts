/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Test } from '.';
import * as GltfGen from '..';

/** @hidden */
export default class EmptyTest implements Test {
	public name = 'Empty glTF';
	public shouldPrintJson = false;
	public shouldPrintBuffer = false;

	public run(): Buffer {
		const factory = new GltfGen.GltfFactory();
		return factory.generateGLTF();
	}
}
