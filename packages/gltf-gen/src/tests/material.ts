/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color4 } from '@microsoft/mixed-reality-extension-common';
import { Test } from '.';
import * as GltfGen from '..';

/** @hidden */
export default class MaterialTest implements Test {
	public name = 'Material';
	public shouldPrintJson = true;
	public shouldPrintBuffer = false;

	public run(): Buffer {
		const prim = new GltfGen.MeshPrimitive({
			vertices: [
				new GltfGen.Vertex({ position: [0, 0, 0], texCoord0: [0, 0] }),
				new GltfGen.Vertex({ position: [1, 0, 0], texCoord0: [1, 0] }),
				new GltfGen.Vertex({ position: [0, 1, 0], texCoord0: [0, 1] })
			],
			triangles: [0, 1, 2],
			material: new GltfGen.Material({
				baseColorFactor: new Color4(1, 0, 0, 1),
				baseColorTexture: new GltfGen.Texture({
					source: new GltfGen.Image({ uri: 'bunny.jpg' })
				})
			})
		});
		return GltfGen.GltfFactory.FromSinglePrimitive(prim).generateGLTF();
	}
}
