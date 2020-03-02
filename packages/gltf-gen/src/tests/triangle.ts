/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from '..';
import { Test } from './index';

/** @hidden */
export default class Triangle implements Test {
	public name = 'Triangle';
	public shouldPrintJson = true;
	public shouldPrintBuffer = true;

	public run() {
		const prim = new GltfGen.MeshPrimitive({
			vertices: [
				new GltfGen.Vertex({ position: [0, 0, 0], texCoord0: [0, 0] }),
				new GltfGen.Vertex({ position: [1, 0, 0], texCoord0: [1, 0] }),
				new GltfGen.Vertex({ position: [0, 1, 0], texCoord0: [0, 1] })
			],
			triangles: [0, 1, 2]
		});

		return GltfGen.GltfFactory.FromSinglePrimitive(prim).generateGLTF();
	}
}
