/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Color3, Color4 } from '@microsoft/mixed-reality-extension-common';
import { AlphaMode } from './enums';
import GLTF from './gen/gltf';
import { Serializable } from './serializable';
import { Texture } from './texture';

export interface MaterialLike {
	name?: string;
	baseColorTexture?: Texture;
	baseColorTexCoord?: number;
	baseColorFactor?: Color4;
	metallicRoughnessTexture?: Texture;
	metallicRoughnessTexCoord?: number;
	metallicFactor?: number;
	roughnessFactor?: number;
	normalTexture?: Texture;
	normalTexCoord?: number;
	normalTexScale?: number;
	occlusionTexture?: Texture;
	occlusionTexCoord?: number;
	occlusionTexStrength?: number;
	emissiveTexture?: Texture;
	emissiveTexCoord?: number;
	emissiveFactor?: Color3;
	alphaMode?: AlphaMode;
	alphaCutoff?: number;
	doubleSided?: boolean;
}

export class Material extends Serializable implements MaterialLike {
	public name: string;

	public baseColorTexture: Texture;
	public baseColorTexCoord = 0;
	public baseColorFactor: Color4 = new Color4(1, 1, 1, 1);

	public metallicRoughnessTexture: Texture;
	public metallicRoughnessTexCoord = 0;
	public metallicFactor = 1;
	public roughnessFactor = 1;

	public normalTexture: Texture;
	public normalTexCoord = 0;
	public normalTexScale = 1;

	public occlusionTexture: Texture;
	public occlusionTexCoord = 0;
	public occlusionTexStrength = 1;

	public emissiveTexture: Texture;
	public emissiveTexCoord = 0;
	public emissiveFactor: Color3 = new Color3(0, 0, 0);

	public alphaMode: AlphaMode = AlphaMode.Opaque;
	public alphaCutoff = 0.5;

	public doubleSided = false;

	constructor(init: MaterialLike = {}) {
		super();
		this.name = init.name;
		this.baseColorTexture = init.baseColorTexture;
		this.baseColorTexCoord = init.baseColorTexCoord || this.baseColorTexCoord;
		this.baseColorFactor = init.baseColorFactor || this.baseColorFactor;
		this.metallicRoughnessTexture = init.metallicRoughnessTexture;
		this.metallicRoughnessTexCoord = init.metallicRoughnessTexCoord || this.metallicRoughnessTexCoord;
		this.metallicFactor = init.metallicFactor || this.metallicFactor;
		this.roughnessFactor = init.roughnessFactor || this.roughnessFactor;
		this.normalTexture = init.normalTexture;
		this.normalTexCoord = init.normalTexCoord || this.normalTexCoord;
		this.normalTexScale = init.normalTexScale || this.normalTexScale;
		this.occlusionTexture = init.occlusionTexture;
		this.occlusionTexCoord = init.occlusionTexCoord || this.occlusionTexCoord;
		this.occlusionTexStrength = init.occlusionTexStrength || this.occlusionTexStrength;
		this.emissiveTexture = init.emissiveTexture;
		this.emissiveTexCoord = init.emissiveTexCoord || this.emissiveTexCoord;
		this.emissiveFactor = init.emissiveFactor || this.emissiveFactor;
		this.alphaMode = init.alphaMode || this.alphaMode;
		this.alphaCutoff = init.alphaCutoff || this.alphaCutoff;
		this.doubleSided = init.doubleSided || this.doubleSided;
	}

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (this.cachedSerialId !== undefined) {
			return this.cachedSerialId;
		}

		const mat: GLTF.Material = {
			name: this.name,
			pbrMetallicRoughness: {
				baseColorFactor: this.baseColorFactor.asArray(),
				metallicFactor: this.metallicFactor,
				roughnessFactor: this.roughnessFactor
			}
		};
		const pbr = mat.pbrMetallicRoughness;

		if (this.name) {
			mat.name = this.name;
		}

		if (this.baseColorTexture) {
			pbr.baseColorTexture = {
				index: this.baseColorTexture.serialize(document, data)
			};
			if (this.baseColorTexCoord !== 0) {
				pbr.baseColorTexture.texCoord = this.baseColorTexCoord;
			}
		}

		if (this.metallicRoughnessTexture) {
			pbr.metallicRoughnessTexture = {
				index: this.metallicRoughnessTexture.serialize(document, data)
			};
			if (this.metallicRoughnessTexCoord !== 0) {
				pbr.metallicRoughnessTexture.texCoord = this.metallicRoughnessTexCoord;
			}
		}

		if (this.normalTexture) {
			mat.normalTexture = {
				index: this.normalTexture.serialize(document, data)
			};
			if (this.normalTexCoord !== 0) {
				mat.normalTexture.texCoord = this.normalTexCoord;
			}
			if (this.normalTexScale !== 1) {
				mat.normalTexture.scale = this.normalTexScale;
			}
		}

		if (this.occlusionTexture) {
			mat.occlusionTexture = {
				index: this.occlusionTexture.serialize(document, data)
			};
			if (this.occlusionTexCoord !== 0) {
				mat.occlusionTexture.texCoord = this.occlusionTexCoord;
			}
			if (this.occlusionTexStrength !== 1) {
				mat.occlusionTexture.strength = this.occlusionTexStrength;
			}
		}

		if (!this.emissiveFactor.equalsFloats(0, 0, 0)) {
			mat.emissiveFactor = this.emissiveFactor.asArray();
		}

		if (this.emissiveTexture) {
			mat.emissiveTexture = {
				index: this.emissiveTexture.serialize(document, data)
			};
			if (this.emissiveTexCoord !== 0) {
				mat.emissiveTexture.texCoord = this.emissiveTexCoord;
			}
		}

		if (this.alphaMode !== AlphaMode.Opaque) {
			mat.alphaMode = this.alphaMode;
			mat.alphaCutoff = this.alphaCutoff;
		}

		if (!document.materials) {
			document.materials = [];
		}
		document.materials.push(mat);

		return this.cachedSerialId = document.materials.length - 1;
	}

	public getByteSize(scanId: number): number {
		if (this.scanList.includes(scanId)) {
			return 0;
		} else {
			this.scanList.push(scanId);
		}

		return [
			this.baseColorTexture,
			this.metallicRoughnessTexture,
			this.normalTexture,
			this.occlusionTexture,
			this.emissiveTexture]
			.reduce((acc, t) => acc + (t ? t.getByteSize(scanId) : 0), 0);
	}
}
