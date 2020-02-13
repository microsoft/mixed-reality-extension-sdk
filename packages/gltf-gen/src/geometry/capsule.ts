/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Material, MeshPrimitive, Vertex } from '..';
import { Vector2, Vector3 } from '@microsoft/mixed-reality-extension-sdk';

/**
 * A MeshPrimitive prepopulated with capsule vertices and triangles
 */
export class Capsule extends MeshPrimitive {
	/**
	 * Generate a new capsule geometry, long axis aligned to local Y.
	 * @param radius The radius of the capsule.
	 * @param height The height of the capsule including end caps. Must be at least 2 * radius.
	 * @param longLines The number of polar vertex rings (running the length of the capsule).
	 * @param latLines The number of equatorial vertex rings (not counting poles) per cap.
	 * @param capUvFraction The amount of texture space the end caps should occupy.
	 * @param material An initial material to apply to the capsule.
	 */
	public constructor(
		radius: number, height: number,	longLines = 12, latLines = 8, capUvFraction = 0.2, material: Material = null
	) {
		super({ material });
		height = Math.max(height, radius * 2);

		const theta = 2 * Math.PI / longLines; // the angle between longitude lines
		const phi = Math.PI / (2 * latLines); // the angle between latitude lines
		const topCap = 0, botCap = 1; // vert indices for poles

		// create poles
		this.vertices.push(
			new Vertex({
				position: new Vector3(0, height / 2, 0),
				normal: Vector3.Up(),
				texCoord0: new Vector2(0.5, 0)
			}),
			new Vertex({
				position: new Vector3(0, -height / 2, 0),
				normal: Vector3.Down(),
				texCoord0: new Vector2(0.5, 1)
			}),
		);

		// start striping longitude lines, starting at +X
		for (let s = 0; s <= longLines; s++) {
			// create end caps, starting at the ring one out from the pole
			for (let r = 1; r <= latLines; r++) {
				const radial = radius * Math.sin(r*phi);

				// create verts
				this.vertices.push(
					new Vertex({
						position: new Vector3(
							radial * Math.cos(s * theta),
							height / 2 - radius * (1 - Math.cos(r * phi)),
							radial * Math.sin(s * theta)),
						normal: new Vector3(
							Math.cos(s * theta),
							1 - Math.cos(r * phi),
							Math.sin(s * theta)),
						texCoord0: new Vector2(1 - s / longLines, r / latLines * capUvFraction)
					}),
					new Vertex({
						position: new Vector3(
							radial * Math.cos(s * theta),
							-height / 2 + radius * (1 - Math.cos(r * phi)),
							radial * Math.sin(s * theta)),
						normal: new Vector3(
							Math.cos(s * theta),
							-1 + Math.cos(r * phi),
							Math.sin(s * theta)),
						texCoord0: new Vector2(1 - s / longLines, 1 - (r / latLines * capUvFraction))
					})
				);

				// find the vertex indices of the four corners of the quad completed by the latest vertex
				const topS1R1 = this.vertices.length - 2, topS1R0 = this.vertices.length - 4;
				const botS1R1 = this.vertices.length - 1, botS1R0 = this.vertices.length - 3;
				const topS0R1 = topS1R1 - 2 * latLines, topS0R0 = topS1R0 - 2 * latLines;
				const botS0R1 = botS1R1 - 2 * latLines, botS0R0 = botS1R0 - 2 * latLines;

				// create faces
				if(s > 0 && r === 1) {
					this.triangles.push(
						topCap, topS1R1, topS0R1,
						botCap, botS0R1, botS1R1
					);
				} else if (s > 0) {
					this.triangles.push(
						topS1R0, topS1R1, topS0R0,
						topS0R0, topS1R1, topS0R1,
						botS0R1, botS1R1, botS0R0,
						botS0R0, botS1R1, botS1R0
					);
				}
			}

			// create long sides
			const topS1 = this.vertices.length - 2, topS0 = topS1 - 2 * latLines;
			const botS1 = this.vertices.length - 1, botS0 = botS1 - 2 * latLines;
			if (s > 0) {
				this.triangles.push(
					topS0, topS1, botS1,
					botS0, topS0, botS1
				);
			}
		}
	}
}
