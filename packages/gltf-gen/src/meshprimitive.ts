/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessorComponentType, AccessorType } from './enums';
import GLTF from './gen/gltf';
import { Material } from './material';
import { roundUpToNextMultipleOf4 } from './util';
import { Vertex } from './vertex';
import { VertexAttribute } from './vertexattributes';

export interface MeshPrimitiveLike {
	vertices?: Vertex[];
	triangles?: number[];
	material?: Material;
}

export class MeshPrimitive implements MeshPrimitiveLike {
	public vertices: Vertex[] = [];
	public triangles: number[] = [];

	public material: Material;

	private instanceParent: MeshPrimitive;
	private usesNormals: boolean;
	private usesTangents: boolean;
	private usesTexCoord0: boolean;
	private usesTexCoord1: boolean;
	private usesColor0: boolean;

	// eslint-disable-next-line default-param-last
	constructor(init: MeshPrimitiveLike = {}, instanceParent?: MeshPrimitive) {
		if (instanceParent) {
			this.instanceParent = instanceParent;
		} else {
			this.vertices = init.vertices || this.vertices;
			this.triangles = init.triangles || this.triangles;
		}

		this.material = init.material || this.material;
	}

	private _updateAttributeUsage(): void {
		this.usesNormals = false;
		this.usesTangents = false;
		this.usesTexCoord0 = false;
		this.usesTexCoord1 = false;
		this.usesColor0 = false;

		for (const v of this.vertices) {
			this.usesNormals = this.usesNormals || v.normal !== undefined;
			this.usesTangents = this.usesTangents || v.tangent !== undefined;
			this.usesTexCoord0 = this.usesTexCoord0 || v.texCoord0 !== undefined;
			this.usesTexCoord1 = this.usesTexCoord1 || v.texCoord1 !== undefined;
			this.usesColor0 = this.usesColor0 || v.color0 !== undefined;
		}
	}

	public getByteSize(scanId: number): number {
		this._updateAttributeUsage();
		const indexSize = this.vertices.length <= 65535 ? 2 : 4;
		const posBufSize = roundUpToNextMultipleOf4(this.vertices.length * Vertex.positionAttribute.byteSize);
		const indexBufSize = roundUpToNextMultipleOf4(this.triangles.length * indexSize);
		let count: number = posBufSize + indexBufSize;

		if (this.usesNormals) {
			count += roundUpToNextMultipleOf4(this.vertices.length * Vertex.normalAttribute.byteSize);
		}
		if (this.usesTangents) {
			count += roundUpToNextMultipleOf4(this.vertices.length * Vertex.tangentAttribute.byteSize);
		}
		if (this.usesTexCoord0) {
			count += roundUpToNextMultipleOf4(this.vertices.length * Vertex.texCoordAttribute[0].byteSize);
		}
		if (this.usesTexCoord1) {
			count += roundUpToNextMultipleOf4(this.vertices.length * Vertex.texCoordAttribute[1].byteSize);
		}
		if (this.usesColor0) {
			count += roundUpToNextMultipleOf4(this.vertices.length * Vertex.colorAttribute.byteSize);
		}

		if (this.material !== undefined) {
			count += this.material.getByteSize(scanId);
		}

		return count;
	}

	private cachedSerialVal: GLTF.MeshPrimitive;

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.MeshPrimitive {

		if (this.cachedSerialVal !== undefined) {
			return this.cachedSerialVal;
		}

		// just dupe the attribute accessors from the instance parent if one exists
		if (this.instanceParent) {
			const prim0 = { ...this.instanceParent.serialize(document, data) };
			prim0.material = this.material.serialize(document, data);
			return this.cachedSerialVal = prim0;
		}

		const prim: GLTF.MeshPrimitive = {
			attributes: {
				POSITION: this._serializeAttribute(Vertex.positionAttribute, document, data)
			},
			indices: this._serializeIndices(document, data)
		};

		if (this.usesNormals) {
			prim.attributes.NORMAL = this._serializeAttribute(Vertex.normalAttribute, document, data);
		}
		if (this.usesTangents) {
			prim.attributes.TANGENT = this._serializeAttribute(Vertex.tangentAttribute, document, data);
		}
		if (this.usesTexCoord0) {
			prim.attributes.TEXCOORD_0 = this._serializeAttribute(Vertex.texCoordAttribute[0], document, data);
		}
		if (this.usesTexCoord1) {
			prim.attributes.TEXCOORD_1 = this._serializeAttribute(Vertex.texCoordAttribute[1], document, data);
		}
		if (this.usesColor0) {
			prim.attributes.COLOR_0 = this._serializeAttribute(Vertex.colorAttribute, document, data);
		}

		if (this.material) {
			prim.material = this.material.serialize(document, data);
		}

		return this.cachedSerialVal = prim;
	}

	private _serializeAttribute(attr: VertexAttribute, document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (!document.bufferViews) {
			document.bufferViews = [];
		}
		if (!document.accessors) {
			document.accessors = [];
		}

		let lastBV: GLTF.BufferView;
		if (document.bufferViews.length) {
			lastBV = document.bufferViews[document.bufferViews.length - 1];
		}

		const bufferView: GLTF.BufferView = {
			buffer: 0,
			byteOffset: lastBV ? roundUpToNextMultipleOf4(lastBV.byteOffset + lastBV.byteLength) : 0,
			byteLength: attr.byteSize * this.vertices.length
		};

		const bufferViewData = data.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

		const accessor: GLTF.Accessor = {
			bufferView: document.bufferViews.length,
			componentType: attr.componentType,
			type: attr.multiType,
			count: this.vertices.length
		};

		// write vertex data
		for (let vi = 0; vi < this.vertices.length; vi++) {
			attr.writeToBuffer(this.vertices[vi], bufferViewData, vi * attr.byteSize);
		}

		// fill padding with zeros
		for (let i = roundUpToNextMultipleOf4(bufferView.byteOffset + bufferView.byteLength) - 1;
			i >= bufferView.byteOffset + bufferView.byteLength;
			i--) {
			data.writeUInt8(0, i);
		}

		accessor.min = attr.min?.asArray();
		accessor.max = attr.max?.asArray();

		document.bufferViews.push(bufferView);
		document.accessors.push(accessor);
		return document.accessors.length - 1;
	}

	private _serializeIndices(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (!document.bufferViews) {
			document.bufferViews = [];
		}
		if (!document.accessors) {
			document.accessors = [];
		}

		let lastBV: GLTF.BufferView;
		if (document.bufferViews.length > 0) {
			lastBV = document.bufferViews[document.bufferViews.length - 1];
		}

		const bufferView: GLTF.BufferView = {
			buffer: 0,
			byteOffset: lastBV ? roundUpToNextMultipleOf4(lastBV.byteOffset + lastBV.byteLength) : 0,
			byteLength: (this.vertices.length <= 65535 ? 2 : 4) * this.triangles.length
		};

		const bufferViewData = data.slice(bufferView.byteOffset, bufferView.byteOffset + bufferView.byteLength);

		const accessor: GLTF.Accessor = {
			bufferView: document.bufferViews.length,
			componentType: this.vertices.length <= 65535 ? AccessorComponentType.UShort : AccessorComponentType.UInt,
			type: AccessorType.Scalar,
			count: this.triangles.length
		};

		if (this.vertices.length <= 65535) {
			for (let ti = 0; ti < this.triangles.length; ti++) {
				bufferViewData.writeUInt16LE(this.triangles[ti], 2 * ti);
			}
		} else {
			for (let ti = 0; ti < this.triangles.length; ti++) {
				bufferViewData.writeUInt32LE(this.triangles[ti], 4 * ti);
			}
		}

		// fill padding with zeros
		for (let i = roundUpToNextMultipleOf4(bufferView.byteOffset + bufferView.byteLength) - 1;
			i >= bufferView.byteOffset + bufferView.byteLength;
			i--) {
			data.writeUInt8(0, i);
		}

		document.bufferViews.push(bufferView);
		document.accessors.push(accessor);
		return document.accessors.length - 1;
	}
}
