/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { resolve } from 'path';
import { readFile as fsReadFile } from 'fs';
import { promisify } from 'util';
const readFile = promisify(fsReadFile);

import * as MRE from '@microsoft/mixed-reality-extension-common';
import { AlphaMode, Image, Material, Mesh, MeshPrimitive, Node, Scene, Texture, TextureWrapMode } from '.';
import GLTF from './gen/gltf';
import { roundUpToNextMultipleOf4 } from './util';

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
		const binLength = glbData.length > (20 + jsonLength) ? glbData.readUInt32LE(20 + jsonLength) : 0;
		const binMagic = glbData.length > (24 + jsonLength) ? glbData.readUInt32LE(24 + jsonLength) : 0;

		// validate header
		if (magic !== 0x46546c67 || version !== 2 || totalLength !== glbData.length
			|| jsonMagic !== 0x4e4f534a || binMagic !== 0 && binMagic !== 0x004e4942) {
			throw new Error(`${path}: Bad GLB header`);
		}

		// read JSON
		const jsonBin = glbData.toString('utf8', 20, 20 + jsonLength);
		const json: GLTF.GlTf = JSON.parse(jsonBin);

		// load buffers
		const buffers = await Promise.all(json.buffers.map(async (bufferDef, i) => {
			if (i === 0 && !bufferDef.uri) {
				if (binMagic !== 0) {
					return glbData.slice(28 + jsonLength, 28 + jsonLength + binLength);
				} else {
					throw new Error(`${path}: Expected embedded binary data`);
				}
			} else {
				return await readFile(resolve(path, bufferDef.uri));
			}
		}));

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

		// scenes
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
