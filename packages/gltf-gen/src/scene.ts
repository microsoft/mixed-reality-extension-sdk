/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import GLTF from './gen/gltf';
import { Node } from './node';
import { Serializable } from './serializable';

export interface SceneLike {
	name?: string;
	nodes?: Node[];
}

export class Scene extends Serializable implements SceneLike {
	public name: string;
	public nodes: Node[] = [];

	constructor(init: SceneLike = {}) {
		super();
		this.name = init.name;
		this.nodes = init.nodes || this.nodes;
	}

	public serialize(document: GLTF.GlTf, data: Buffer): GLTF.GlTfId {
		if (this.cachedSerialId) {
			return this.cachedSerialId;
		}

		const scene: GLTF.Scene = {
			name: this.name,
			nodes: this.nodes.length ? this.nodes.map(n => n.serialize(document, data)) : undefined
		};

		if (!document.scenes) {
			document.scenes = [];
		}
		document.scenes.push(scene);

		return this.cachedSerialId = document.scenes.length - 1;
	}

	public getByteSize(scanId: number): number {
		if (this.scanList.includes(scanId)) {
			return 0;
		} else {
			this.scanList.push(scanId);
		}

		return this.nodes.reduce((acc, n) => acc + n.getByteSize(scanId), 0);
	}
}
