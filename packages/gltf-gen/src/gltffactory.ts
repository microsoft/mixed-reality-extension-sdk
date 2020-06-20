/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { resolve } from 'path';
import { readFile as fsReadFile } from 'fs';
import { promisify } from 'util';
const readFile = promisify(fsReadFile);

import * as MRE from '@microsoft/mixed-reality-extension-common';
import {
	AccessorComponentType,
	AlphaMode,
	Image,
	Material,
	Mesh,
	MeshPrimitive,
	Node,
	Scene,
	Texture,
	TextureWrapMode,
	Vertex
} from '.';
import GLTF from './gen/gltf';
import { roundUpToNextMultipleOf4 } from './util';
import { AccessorType } from './enums';

/**
 * Generates a glTF document from mesh data
 */
export class GltfFactory {
	public textures: Texture[];
	public materials: Material[];
	public meshes: Mesh[];
	public scenes: Scene[];

	public constructor(
		scenes: Scene[] = [],
		meshes: Mesh[] = [],
		materials: Material[] = [],
		textures: Texture[] = []) {
		this.textures = textures || [];
		this.materials = materials || [];
		this.meshes = meshes || [];
		this.scenes = scenes || [];
	}

	/**
	 * Convert the factory's scenes and other resources into a GLB buffer.
	 * @returns A buffer containing a glTF document in GLB format
	 */
	public generateGLTF(): Buffer {
		const scanId = Math.floor(1000000 * Math.random());
		const dataBufferSize =
			(this.textures.length ? this.textures.reduce((acc, t) => acc + t.getByteSize(scanId), 0) : 0) +
			(this.materials.length ? this.materials.reduce((acc, m) => acc + m.getByteSize(scanId), 0) : 0) +
			(this.meshes.length ? this.meshes.reduce((acc, m) => acc + m.getByteSize(scanId), 0) : 0) +
			(this.scenes.length ? this.scenes.reduce((acc, s) => acc + s.getByteSize(scanId), 0) : 0);

		const binaryData = Buffer.allocUnsafe(roundUpToNextMultipleOf4(dataBufferSize));

		const document: GLTF.GlTf = {
			asset: {
				version: '2.0',
				generator: '@microsoft/gltf-gen'
			}
		};

		if (binaryData.length > 0) {
			document.buffers = [{
				byteLength: dataBufferSize
			}];
		}

		this.textures.forEach(t => t.serialize(document, binaryData));
		this.materials.forEach(m => m.serialize(document, binaryData));
		this.meshes.forEach(m => m.serialize(document, binaryData));
		this.scenes.forEach(s => s.serialize(document, binaryData));

		let json = JSON.stringify(document);
		while (Buffer.byteLength(json, 'utf8') % 4 > 0) {
			json += ' ';
		}
		const jsonLength = Buffer.byteLength(json, 'utf8');

		const gltfData = Buffer.allocUnsafe(jsonLength + binaryData.length + 28);
		gltfData.writeUInt32LE(0x46546c67, 0); // "glTF"
		gltfData.writeUInt32LE(2, 4); // GLB version number
		gltfData.writeUInt32LE(gltfData.length, 8); // length of the total file

		gltfData.writeUInt32LE(jsonLength, 12); // length of the JSON
		gltfData.writeUInt32LE(0x4e4f534a, 16); // "JSON"
		gltfData.write(json, 20, jsonLength, 'utf8');

		gltfData.writeUInt32LE(binaryData.length, 20 + jsonLength); // length of the binary
		gltfData.writeUInt32LE(0x004e4942, 20 + jsonLength + 4); // " BIN"
		binaryData.copy(gltfData, 20 + jsonLength + 8);

		return gltfData;
	}

	/**
	 * Populate this [[GltfFactory]] with the resources from a GLB file.
	 * @param path The file path to a GLB file.
	 */
	public async importFromGlb(path: string) {
		const glbData = await readFile(path);

		// read header
		const magic = glbData.readUInt32LE(0);
		const version = glbData.readUInt32LE(4);
		const totalLength = glbData.readUInt32LE(8);
		const jsonLength = glbData.readUInt32LE(12);
		const jsonMagic = glbData.readUInt32LE(16);
		const binLength = glbData.length > (20 + jsonLength) ? glbData.readUInt32LE(20 + jsonLength) : -1;
		const binMagic = glbData.length > (24 + jsonLength) ? glbData.readUInt32LE(24 + jsonLength) : -1;

		// validate header
		if (magic !== 0x46546c67 || version !== 2 || totalLength !== glbData.length
			|| jsonMagic !== 0x4e4f534a || binMagic !== -1 && binMagic !== 0x004e4942) {
			throw new Error(`${path}: Bad GLB header`);
		}

		// read JSON
		const jsonBin = glbData.toString('utf8', 20, 20 + jsonLength);
		const json: GLTF.GlTf = JSON.parse(jsonBin);

		// load buffers
		const buffers = await Promise.all(json.buffers?.map(async (bufferDef, i) => {
			if (i === 0 && !bufferDef.uri) {
				if (binMagic !== -1) {
					return glbData.slice(28 + jsonLength, 28 + jsonLength + binLength);
				} else {
					throw new Error(`${path}: Expected embedded binary data`);
				}
			} else {
				return await readFile(resolve(path, bufferDef.uri));
			}
		}) ?? []);

		// process data
		this.importFromGltfData(json, buffers);
	}

	/**
	 * Populate this [[GltfFactory]] with the resources from a glTF file.
	 * @param path
	 */
	public async importFromGltf(path: string) {
		const gltfData = await readFile(path, { encoding: 'utf8' });
		const json = JSON.parse(gltfData) as GLTF.GlTf;
		const buffers: Buffer[] = [];
		for (const bufferDef of json.buffers) {
			const b = await readFile(resolve(path, bufferDef.uri));
			buffers.push(b);
		}

		this.importFromGltfData(json, buffers);
	}

	private importFromGltfData(json: GLTF.GlTf, buffers: Buffer[]) {
		// textures
		for (const texDef of json.textures || []) {
			const tex = new Texture({
				name: texDef.name,
				wrapS: TextureWrapMode.Repeat,
				wrapT: TextureWrapMode.Repeat
			});
			if (texDef.sampler !== undefined) {
				const sampler = json.samplers[texDef.sampler];
				tex.wrapS = sampler.wrapS ?? TextureWrapMode.Repeat;
				tex.wrapT = sampler.wrapT ?? TextureWrapMode.Repeat;
				tex.minFilter = sampler.minFilter;
				tex.magFilter = sampler.magFilter;
			}

			const imgDef = json.images[texDef.source];
			const img = tex.source = new Image({
				name: imgDef.name,
				mimeType: imgDef.mimeType
			});

			if (imgDef.bufferView !== undefined) {
				const bvDef = json.bufferViews[imgDef.bufferView];
				const buf = buffers[bvDef.buffer];
				img.embeddedData = buf.slice(bvDef.byteOffset, bvDef.byteOffset + bvDef.byteLength);
			} else {
				img.uri = imgDef.uri;
			}

			this.textures.push(tex);
		}

		// materials
		for (const matDef of json.materials || []) {
			const mat = new Material({
				name: matDef.name,
				baseColorTexCoord: matDef.pbrMetallicRoughness?.baseColorTexture?.texCoord,
				metallicRoughnessTexCoord: matDef.pbrMetallicRoughness?.metallicRoughnessTexture?.texCoord,
				metallicFactor: matDef.pbrMetallicRoughness?.metallicFactor,
				roughnessFactor: matDef.pbrMetallicRoughness?.roughnessFactor,
				normalTexCoord: matDef.normalTexture?.texCoord,
				normalTexScale: matDef.normalTexture?.scale,
				occlusionTexCoord: matDef.occlusionTexture?.texCoord,
				occlusionTexStrength: matDef.occlusionTexture?.strength,
				emissiveTexCoord: matDef.emissiveTexture?.texCoord,
				alphaMode: matDef.alphaMode === "BLEND" ? AlphaMode.Blend :
					matDef.alphaMode === "MASK" ? AlphaMode.Mask :
						AlphaMode.Opaque,
				alphaCutoff: matDef.alphaCutoff,
				doubleSided: matDef.doubleSided
			});

			if (matDef.pbrMetallicRoughness) {
				const pbr = matDef.pbrMetallicRoughness;
				if (pbr.baseColorTexture) {
					mat.baseColorTexture = this.textures[pbr.baseColorTexture.index];
				}
				if (pbr.baseColorFactor) {
					mat.baseColorFactor = MRE.Color4.FromArray(pbr.baseColorFactor);
				}
				if (pbr.metallicRoughnessTexture) {
					mat.metallicRoughnessTexture = this.textures[pbr.metallicRoughnessTexture.index];
				}
			}

			if (matDef.normalTexture) {
				mat.normalTexture = this.textures[matDef.normalTexture.index];
			}
			if (matDef.occlusionTexture) {
				mat.occlusionTexture = this.textures[matDef.occlusionTexture.index];
			}
			if (matDef.emissiveTexture) {
				mat.emissiveTexture = this.textures[matDef.emissiveTexture.index];
			}
			if (matDef.emissiveFactor) {
				mat.emissiveFactor = MRE.Color3.FromArray(matDef.emissiveFactor);
			}

			this.materials.push(mat);
		}

		// meshes
		const instancingHash: { [sig: string]: MeshPrimitive } = {};
		for (const meshDef of json.meshes || []) {
			const mesh = new Mesh({
				name: meshDef.name
			});

			for (const primDef of meshDef.primitives) {
				if (primDef.mode !== undefined && primDef.mode !== 4) {
					throw new Error(`Import failed: can only import meshes in triangle format`);
				}

				// if all the attribute accessors are the same, don't re-parse, just instance
				const sig = GltfFactory.GetMeshInstanceHash(primDef);
				const prim = new MeshPrimitive({ material: this.materials[primDef.material] }, instancingHash[sig]);
				if (instancingHash[sig]) {
					mesh.primitives.push(prim);
					continue;
				}
				instancingHash[sig] = prim;

				const posAcc = json.accessors[primDef.attributes[Vertex.positionAttribute.attributeName]];
				const nrmAcc = json.accessors[primDef.attributes[Vertex.normalAttribute.attributeName]];
				const tngAcc = json.accessors[primDef.attributes[Vertex.tangentAttribute.attributeName]];
				const uv0Acc = json.accessors[primDef.attributes[Vertex.texCoordAttribute[0].attributeName]];
				const uv1Acc = json.accessors[primDef.attributes[Vertex.texCoordAttribute[1].attributeName]];
				const clrAcc = json.accessors[primDef.attributes[Vertex.colorAttribute.attributeName]];
				const posBV = json.bufferViews[posAcc?.bufferView];
				const nrmBV = json.bufferViews[nrmAcc?.bufferView];
				const tngBV = json.bufferViews[tngAcc?.bufferView];
				const uv0BV = json.bufferViews[uv0Acc?.bufferView];
				const uv1BV = json.bufferViews[uv1Acc?.bufferView];
				const clrBV = json.bufferViews[clrAcc?.bufferView];

				for (let i = 0; i < posAcc.count; i++) {
					const vert = new Vertex();
					if (posAcc) {
						const attr = Vertex.positionAttribute;
						const offset = (posBV.byteOffset ?? 0) + (posAcc.byteOffset ?? 0) +
							i * ((posBV.byteStride ?? 0) + attr.byteSize);
						vert.position = new MRE.Vector3(
							buffers[posBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
							buffers[posBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize),
							buffers[posBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize));
					}
					if (nrmAcc) {
						const attr = Vertex.normalAttribute;
						const offset = (nrmBV.byteOffset ?? 0) + (nrmAcc.byteOffset ?? 0) +
							i * ((nrmBV.byteStride ?? 0) + attr.byteSize);
						vert.normal = new MRE.Vector3(
							buffers[nrmBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
							buffers[nrmBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize),
							buffers[nrmBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize));
					}
					if (tngAcc) {
						const attr = Vertex.tangentAttribute;
						const offset = (tngBV.byteOffset ?? 0) + (tngAcc.byteOffset ?? 0) +
							i * ((tngBV.byteStride ?? 0) + attr.byteSize);
						vert.tangent = new MRE.Vector4(
							buffers[tngBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
							buffers[tngBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize),
							buffers[tngBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize),
							buffers[tngBV.buffer].readFloatLE(offset + 3 * attr.elementByteSize));
					}
					if (uv0Acc) {
						const attr = Vertex.texCoordAttribute[0];
						const offset = (uv0BV.byteOffset ?? 0) + (uv0Acc.byteOffset ?? 0) +
							i * ((uv0BV.byteStride ?? 0) + attr.byteSize);
						if (uv0Acc.componentType === AccessorComponentType.Float) {
							vert.texCoord0 = new MRE.Vector2(
								buffers[uv0BV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
								buffers[uv0BV.buffer].readFloatLE(offset + 1 * attr.elementByteSize));
						} else if (uv0Acc.componentType === AccessorComponentType.UByte) {
							vert.texCoord0 = new MRE.Vector2(
								buffers[uv0BV.buffer].readUInt8(offset + 0 * attr.elementByteSize),
								buffers[uv0BV.buffer].readUInt8(offset + 1 * attr.elementByteSize))
								.multiplyByFloats(1 / 0xff, 1 / 0xff);
						} else if (uv0Acc.componentType === AccessorComponentType.UShort) {
							vert.texCoord0 = new MRE.Vector2(
								buffers[uv0BV.buffer].readUInt16LE(offset + 0 * attr.elementByteSize),
								buffers[uv0BV.buffer].readUInt16LE(offset + 1 * attr.elementByteSize))
								.multiplyByFloats(1 / 0xffff, 1 / 0xffff);
						}
					}
					if (uv1Acc) {
						const attr = Vertex.texCoordAttribute[1];
						const offset = (uv1BV.byteOffset ?? 0) + (uv1Acc.byteOffset ?? 0) +
							i * ((uv1BV.byteStride ?? 0) + attr.byteSize);
						if (uv1Acc.componentType === AccessorComponentType.Float) {
							vert.texCoord1 = new MRE.Vector2(
								buffers[uv1BV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
								buffers[uv1BV.buffer].readFloatLE(offset + 1 * attr.elementByteSize));
						} else if (uv1Acc.componentType === AccessorComponentType.UByte) {
							vert.texCoord1 = new MRE.Vector2(
								buffers[uv1BV.buffer].readUInt8(offset + 0 * attr.elementByteSize),
								buffers[uv1BV.buffer].readUInt8(offset + 1 * attr.elementByteSize))
								.multiplyByFloats(1 / 0xff, 1 / 0xff);
						} else if (uv1Acc.componentType === AccessorComponentType.UShort) {
							vert.texCoord1 = new MRE.Vector2(
								buffers[uv1BV.buffer].readUInt16LE(offset + 0 * attr.elementByteSize),
								buffers[uv1BV.buffer].readUInt16LE(offset + 1 * attr.elementByteSize))
								.multiplyByFloats(1 / 0xffff, 1 / 0xffff);
						}
					}
					if (clrAcc) {
						// TODO: fix accessor size
						const attr = Vertex.colorAttribute;
						const offset = (clrBV.byteOffset ?? 0) + (clrAcc.byteOffset ?? 0) +
							i * ((clrBV.byteStride ?? 0) + attr.byteSize);
						if (clrAcc.componentType === AccessorComponentType.Float) {
							vert.color0 = new MRE.Color4(
								buffers[clrBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize),
								buffers[clrBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize),
								buffers[clrBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize));
							if (clrAcc.type === AccessorType.Vec4) {
								vert.color0.a = buffers[clrBV.buffer]
									.readFloatLE(offset + 3 * attr.elementByteSize);
							}
						} else if (clrAcc.componentType === AccessorComponentType.UByte) {
							vert.color0 = new MRE.Color4(
								buffers[clrBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize) * 1 / 0xff,
								buffers[clrBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize) * 1 / 0xff,
								buffers[clrBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize) * 1 / 0xff);
							if (clrAcc.type === AccessorType.Vec4) {
								vert.color0.a = buffers[clrBV.buffer]
									.readFloatLE(offset + 3 * attr.elementByteSize) * 1 / 0xff;
							}
						} else if (clrAcc.componentType === AccessorComponentType.UShort) {
							vert.color0 = new MRE.Color4(
								buffers[clrBV.buffer].readFloatLE(offset + 0 * attr.elementByteSize) * 1 / 0xffff,
								buffers[clrBV.buffer].readFloatLE(offset + 1 * attr.elementByteSize) * 1 / 0xffff,
								buffers[clrBV.buffer].readFloatLE(offset + 2 * attr.elementByteSize) * 1 / 0xffff);
							if (clrAcc.type === AccessorType.Vec4) {
								vert.color0.a = buffers[clrBV.buffer]
									.readFloatLE(offset + 3 * attr.elementByteSize) * 1 / 0xffff;
							}
						}
					}

					prim.vertices.push(vert);
				}

				mesh.primitives.push(prim);
			}

			this.meshes.push(mesh);
		}

		// scenes
		for (const sceneDef of json.scenes || []) {
			const scene = new Scene({
				name: sceneDef.name,
				nodes: (sceneDef.nodes ?? []).map(nodeId => this.importNode(json, nodeId))
			});
			this.scenes.push(scene);
		}
	}

	private importNode(json: GLTF.GlTf, nodeId: number) {
		const nodeDef = json.nodes[nodeId];
		const node = new Node({
			name: nodeDef.name,
			mesh: this.meshes[nodeDef.mesh]
		});

		if (nodeDef.matrix) {
			node.matrix = MRE.Matrix.FromArray(nodeDef.matrix);
		} else {
			node.translation = nodeDef.translation ? MRE.Vector3.FromArray(nodeDef.translation) : MRE.Vector3.Zero();
			node.rotation = nodeDef.rotation ? MRE.Quaternion.FromArray(nodeDef.rotation) : MRE.Quaternion.Identity();
			node.scale = nodeDef.scale ? MRE.Vector3.FromArray(nodeDef.scale) : MRE.Vector3.One();
		}

		node.children = (nodeDef.children ?? []).map(childId => this.importNode(json, childId));

		return node;
	}

	private static GetMeshInstanceHash(primDef: GLTF.MeshPrimitive) {
		const attributeNames = [
			Vertex.positionAttribute.attributeName,
			Vertex.normalAttribute.attributeName,
			Vertex.tangentAttribute.attributeName,
			Vertex.texCoordAttribute[0].attributeName,
			Vertex.texCoordAttribute[1].attributeName,
			Vertex.colorAttribute.attributeName
		]

		return attributeNames
			.map(attr => primDef.attributes[attr])
			.join('-')
			+ '-' + primDef.indices;
	}

	/**
	 * Generate a [[GltfFactory]] from a single [[MeshPrimitive]].
	 * @param prim The sole prim in the glTF
	 */
	public static FromSinglePrimitive(prim: MeshPrimitive): GltfFactory {
		return new GltfFactory(
			[new Scene({
				nodes: [
					new Node({
						mesh: new Mesh({
							primitives: [prim]
						})
					})
				]
			})]
		);
	}
}
