/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, MeshPrimitive, Vertex } from '..';
import { Vector2, Vector3 } from '@microsoft/mixed-reality-extension-shared';

/**
 * A MeshPrimitive prepopulated with a single +Z-facing quad's vertices and triangles
 */
export class Quad extends MeshPrimitive {
	/**
	 * Build quad geometry
	 * @param width The size of the quad along the X axis
	 * @param height The size of the quad along the Y axis
	 * @param material An initial material to apply to the quad
	 */
	public constructor(width: number, height: number, material: Material = null) {
		super({material});

		// make geo corners
		const extent = new Vector3(width / 2, height / 2, 0);
		const pxpy = extent.clone();
		const pxny = extent.multiplyByFloats(1, -1, 1);
		const nxpy = extent.multiplyByFloats(-1, 1, 1);
		const nxny = extent.multiplyByFloats(-1, -1, 1);

		// make normal vectors
		const forward = Vector3.Forward();

		// make UV corners
		const uvTopLeft = new Vector2(0, 0);
		const uvTopRight = new Vector2(1, 0);
		const uvBottomLeft = new Vector2(0, 1);
		const uvBottomRight = new Vector2(1, 1);

		// make forward face
		this.vertices.push(
			new Vertex({ position: nxpy, normal: forward, texCoord0: uvTopLeft }),
			new Vertex({ position: pxpy, normal: forward, texCoord0: uvTopRight }),
			new Vertex({ position: nxny, normal: forward, texCoord0: uvBottomLeft }),
			new Vertex({ position: pxny, normal: forward, texCoord0: uvBottomRight }));
		this.triangles.push(1, 0, 3, 0, 2, 3);
	}
}
