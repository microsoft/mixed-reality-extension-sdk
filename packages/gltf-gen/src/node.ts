/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Matrix, Quaternion, Vector3 } from '@microsoft/mixed-reality-extension-shared';
import GLTF from './gen/gltf';
import { Mesh } from './mesh';
import { Serializable } from './serializable';

export interface NodeLike {
	name?: string;
	mesh?: Mesh;
	translation?: Vector3;
	rotation?: Quaternion;
	scale?: Vector3;
	matrix?: Matrix;
	children?: Node[];
}

export class Node extends Serializable implements NodeLike {
	public name: string;
	public mesh: Mesh;

	public translation: Vector3 = new Vector3(0, 0, 0);
	public rotation: Quaternion = new Quaternion(0, 0, 0, 1);
	public scale: Vector3 = new Vector3(1, 1, 1);
	public matrix: Matrix;

	public children: Node[] = [];

	constructor(init: NodeLike = {}) {
		super();
		this.name = init.name;
		this.mesh = init.mesh;

		this.translation = init.translation || this.translation;
		this.rotation = init.rotation || this.rotation;
		this.scale = init.scale || this.scale;
		this.matrix = init.matrix;

		this.children = init.children || this.children;
	}

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (this.cachedSerialId) {
			return this.cachedSerialId;
		}

		const node: GLTF.Node = {
			name: this.name,
			mesh: this.mesh ? this.mesh.serialize(document, data) : undefined,
			children: this.children.length ? this.children.map(n => n.serialize(document, data)) : undefined
		};

		if (this.matrix) {
			node.matrix = Array.from(this.matrix.asArray());
		} else {
			if (!this.translation.equals(Vector3.Zero())) {
				node.translation = this.translation.asArray();
			}
			if (!Quaternion.IsIdentity(this.rotation)) {
				node.rotation = this.rotation.asArray();
			}
			if (!this.scale.equals(Vector3.One())) {
				node.scale = this.scale.asArray();
			}
		}

		if (!document.nodes) {
			document.nodes = [];
		}
		document.nodes.push(node);

		return this.cachedSerialId = document.nodes.length - 1;
	}

	public getByteSize(scanId: number): number {
		if (this.scanList.includes(scanId)) {
			return 0;
		} else {
			this.scanList.push(scanId);
		}

		return (this.mesh !== undefined ? this.mesh.getByteSize(scanId) : 0)
			+ this.children.reduce((acc, n) => acc + n.getByteSize(scanId), 0);
	}
}
