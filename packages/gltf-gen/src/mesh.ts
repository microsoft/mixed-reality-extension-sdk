/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import GLTF from './gen/gltf';
import { MeshPrimitive } from './meshprimitive';
import { Serializable } from './serializable';

export interface MeshLike {
	name?: string;
	primitives?: MeshPrimitive[];
}

export class Mesh extends Serializable implements MeshLike {
	public name: string;
	public primitives: MeshPrimitive[] = [];

	constructor(init: MeshLike = {}) {
		super();
		this.name = init.name;
		this.primitives = init.primitives || this.primitives;
	}

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (this.cachedSerialId !== undefined) {
			return this.cachedSerialId;
		}

		const mesh: GLTF.Mesh = {
			name: this.name,
			primitives: this.primitives.map(p => p.serialize(document, data))
		};

		if (!document.meshes) {
			document.meshes = [];
		}
		document.meshes.push(mesh);

		return this.cachedSerialId = (document.meshes.length - 1);
	}

	public getByteSize(scanId: number): number {
		if (this.scanList.includes(scanId)) {
			return 0;
		} else {
			this.scanList.push(scanId);
		}

		return this.primitives.reduce((acc, p) => acc + p.getByteSize(scanId), 0);
	}
}
