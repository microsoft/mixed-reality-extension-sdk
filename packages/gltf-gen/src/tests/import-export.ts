/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import crypto from 'crypto';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { writeFile as _wf } from 'fs';
import { promisify } from 'util';
const writeFile = promisify(_wf);

import * as GltfGen from '..';
import * as MRE from '@microsoft/mixed-reality-extension-common';
import { Test } from './index';
import { prettyPrintBuffer } from './util';

/** @hidden */
export default class ImportExport implements Test {
	public name = 'ImportExport';
	public shouldPrintJson = true;
	public shouldPrintBuffer = true;

	public async run() {
		const texs = [
			new GltfGen.Texture({
				name: "texture1",
				source: new GltfGen.Image({
					name: "image1",
					uri: "./image1.jpg"
				})
			}),
			new GltfGen.Texture({
				name: "texture2",
				source: new GltfGen.Image({
					name: "image2",
					// single pixel png
					embeddedData: Buffer.from([
						0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
						0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
						0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,0x54,0x08,0xD7,0x63,0xF8,0xFF,0xFF,0x3F,
						0x00,0x05,0xFE,0x02,0xFE,0xDC,0xCC,0x59,0xE7,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
						0x44,0xAE,0x42,0x60,0x82
					]),
					mimeType: 'image/png'
				})
			})
		];
		const mats = [
			new GltfGen.Material({
				name: "material1",
				baseColorTexture: texs[0]
			}),
			new GltfGen.Material({
				name: "material2",
				emissiveTexture: texs[1]
			})
		];
		const meshPrim = new GltfGen.MeshPrimitive({
			vertices: [
				new GltfGen.Vertex({
					position: new MRE.Vector3(0, 0, 0),
					normal: new MRE.Vector3(0, 0, 1),
					texCoord0: new MRE.Vector2(0, 0)
				}),
				new GltfGen.Vertex({
					position: new MRE.Vector3(1, 0, 0),
					normal: new MRE.Vector3(0, 0, 1),
					texCoord0: new MRE.Vector2(1, 0)
				}),
				new GltfGen.Vertex({
					position: new MRE.Vector3(0, 1, 0),
					normal: new MRE.Vector3(0, 0, 1),
					texCoord0: new MRE.Vector2(0, 1)
				})
			],
			triangles: [0, 1, 2],
			material: mats[0]
		});
		const meshes = [
			new GltfGen.Mesh({
				name: "mesh1",
				primitives: [meshPrim]
			}),
			new GltfGen.Mesh({
				name: "mesh2",
				primitives: [new GltfGen.MeshPrimitive({
					material: mats[1]
				}, meshPrim)]
			})
		];
		const scenes = [new GltfGen.Scene({
			name: "mainScene",
			nodes: [
				new GltfGen.Node({
					name: "node1",
					mesh: meshes[0],
					matrix: MRE.Matrix.FromValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1)
				}),
				new GltfGen.Node({
					name: "node2",
					mesh: meshes[1],
					translation: new MRE.Vector3(1, 0, 0)
				}),
				new GltfGen.Node({
					name: "node3",
					mesh: meshes[0],
					translation: new MRE.Vector3(2, 0, 0),
					rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI / 2),
					scale: new MRE.Vector3(1.1, 1.1, 1.1)
				})
			]
		})];

		const sourceFactory = new GltfGen.GltfFactory(scenes);

		// generate glb
		const sourceBuffer = sourceFactory.generateGLTF();
		const tempGlbPath = resolve(tmpdir(), './temp.glb');
		await writeFile(tempGlbPath, sourceBuffer);
		const hash1 = crypto.createHash('sha256').update(sourceBuffer.slice(0x6b0)).digest('hex');
		prettyPrintBuffer(sourceBuffer);
		console.log('Source hashes to', hash1);

		// import and re-export glb
		const destFactory = new GltfGen.GltfFactory();
		await destFactory.importFromGlb(tempGlbPath);
		const destBuffer = destFactory.generateGLTF();
		const hash2 = crypto.createHash('sha256').update(destBuffer.slice(0x6b0)).digest('hex');
		prettyPrintBuffer(destBuffer);
		console.log('Dest hashes to', hash2);

		// compare source and dest buffers
		if (hash1 !== hash2) {
			throw new Error("Imported GLB does not match exported GLB!");
		}

		return destBuffer;
	}
}
