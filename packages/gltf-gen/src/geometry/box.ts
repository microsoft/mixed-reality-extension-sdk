/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, MeshPrimitive, Vertex } from '..';
import { Vector2, Vector3 } from '@microsoft/mixed-reality-extension-shared';

/**
 * A MeshPrimitive prepopulated with box vertices and triangles
 */
export class Box extends MeshPrimitive {
	/**
	 * Build a box geometry
	 * @param width The size of the box along the X axis
	 * @param height The size of the box along the Y axis
	 * @param depth The size of the box along the Z axis
	 * @param material An initial material to apply to the box
	 */
	public constructor(width: number, height: number, depth: number, material: Material = null) {
		super({material});

		// make geo corners
		const extent = new Vector3(width / 2, height / 2, depth / 2);
		const pxpypz = extent.clone();
		const pxpynz = extent.multiplyByFloats(1, 1, -1);
		const pxnypz = extent.multiplyByFloats(1, -1, 1);
		const pxnynz = extent.multiplyByFloats(1, -1, -1);
		const nxpypz = extent.multiplyByFloats(-1, 1, 1);
		const nxpynz = extent.multiplyByFloats(-1, 1, -1);
		const nxnypz = extent.multiplyByFloats(-1, -1, 1);
		const nxnynz = extent.multiplyByFloats(-1, -1, -1);

		// make normal vectors
		const right = Vector3.Right();
		const left = Vector3.Left();
		const up = Vector3.Up();
		const down = Vector3.Down();
		const forward = Vector3.Forward();
		const backward = Vector3.Backward();

		// make UV corners
		const uvTopLeft = new Vector2(0, 0);
		const uvTopRight = new Vector2(1, 0);
		const uvBottomLeft = new Vector2(0, 1);
		const uvBottomRight = new Vector2(1, 1);

		// make right face
		let io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: nxpynz, normal: right, texCoord0: uvTopLeft }),
			new Vertex({ position: nxpypz, normal: right, texCoord0: uvTopRight }),
			new Vertex({ position: nxnynz, normal: right, texCoord0: uvBottomLeft }),
			new Vertex({ position: nxnypz, normal: right, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);

		// make left face
		io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: pxpypz, normal: left, texCoord0: uvTopLeft }),
			new Vertex({ position: pxpynz, normal: left, texCoord0: uvTopRight }),
			new Vertex({ position: pxnypz, normal: left, texCoord0: uvBottomLeft }),
			new Vertex({ position: pxnynz, normal: left, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);

		// make top face
		io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: pxpypz, normal: up, texCoord0: uvTopLeft }),
			new Vertex({ position: nxpypz, normal: up, texCoord0: uvTopRight }),
			new Vertex({ position: pxpynz, normal: up, texCoord0: uvBottomLeft }),
			new Vertex({ position: nxpynz, normal: up, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);

		// make bottom face
		io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: pxnynz, normal: down, texCoord0: uvTopLeft }),
			new Vertex({ position: nxnynz, normal: down, texCoord0: uvTopRight }),
			new Vertex({ position: pxnypz, normal: down, texCoord0: uvBottomLeft }),
			new Vertex({ position: nxnypz, normal: down, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);

		// make forward face
		io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: nxpypz, normal: forward, texCoord0: uvTopLeft }),
			new Vertex({ position: pxpypz, normal: forward, texCoord0: uvTopRight }),
			new Vertex({ position: nxnypz, normal: forward, texCoord0: uvBottomLeft }),
			new Vertex({ position: pxnypz, normal: forward, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);

		// make backward face
		io = this.vertices.length;
		this.vertices.push(
			new Vertex({ position: pxpynz, normal: backward, texCoord0: uvTopLeft }),
			new Vertex({ position: nxpynz, normal: backward, texCoord0: uvTopRight }),
			new Vertex({ position: pxnynz, normal: backward, texCoord0: uvBottomLeft }),
			new Vertex({ position: nxnynz, normal: backward, texCoord0: uvBottomRight }));
		this.triangles.push(io + 1, io + 0, io + 3, io + 0, io + 2, io + 3);
	}
}
