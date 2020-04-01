/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, MeshPrimitive, Vertex } from '..';
import { Vector2, Vector3 } from '@microsoft/mixed-reality-extension-shared';

/**
 * A MeshPrimitive prepopulated with a subdivided +Z-facing plane's vertices and triangles
 */
export class Plane extends MeshPrimitive {
	/**
	 * Build quad geometry
	 * @param width The size of the plane along the X axis
	 * @param height The size of the plane along the Y axis
	 * @param uSegments The number of subdivisions along the X axis
	 * @param vSegments The number of subdivisions along the Y axis
	 * @param material An initial material to apply to the plane
	 */
	public constructor(width: number, height: number, uSegments = 10, vSegments = 10, material: Material = null) {
		super({material});

		const forward = Vector3.Forward();
		const halfWidth = width / 2;
		const halfHeight = height / 2;

		for (let u = 0; u <= uSegments; u++) {
			const uFrac = u / uSegments;
			for (let v = 0; v <= vSegments; v++) {
				const vFrac = v / vSegments;

				// add a vertex
				this.vertices.push(new Vertex({
					position: new Vector3(
						-halfWidth + uFrac * width,
						halfHeight - vFrac * height,
						0),
					normal: forward,
					texCoord0: new Vector2(uFrac, vFrac)
				}));

				if (u > 0 && v > 0) {
					const io = this.vertices.length - 1;
					// (vSegments - 1) verts per stripe
					const topLeft = io - vSegments - 2;
					const topRight = io - 1;
					const bottomLeft = io - vSegments - 1;
					const bottomRight = io;
					this.triangles.push(topLeft, bottomLeft, bottomRight, topLeft, bottomRight, topRight);
				}
			}
		}
	}
}
