/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as GltfGen from "..";
import { Test } from "./index";

/** @hidden */
export default class MeshPrimitive implements Test {
	public name = "MeshPrimitive";
	public shouldPrintJson = true;
	public shouldPrintBuffer = true;

	public run() {
		const vertices = [];
		const MAX_SHORT = 65535;
		// Add enough vertices so the triangles field needs integer sized
		// numbers to reference all of them
		for (let i = 0; i < MAX_SHORT + 2; i++) {
			const x = i / (MAX_SHORT + 1);
			vertices.push(
				new GltfGen.Vertex({ position: [x, x, x], texCoord0: [x, x] })
			);
		}

		const prim = new GltfGen.MeshPrimitive({
			vertices,
			// Reference the final vertex. This will throw an error if it trys
			// to write to an array of UShorts
			triangles: [0, 1, 2, 3, 4, MAX_SHORT + 1],
		});

		return GltfGen.GltfFactory.FromSinglePrimitive(prim).generateGLTF();
	}
}
