/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import { Actor } from '..';

export interface MeshLike {
	/** The number of vertices in this mesh. */
	vertexCount: number;
	/** The number of triangles in this mesh. */
	triangleCount: number;
}

export class Mesh extends Asset implements MeshLike {
	// tslint:disable:variable-name
	private _vertexCount: number;
	private _triangleCount: number;
	// tslint:disable:variable-name

	/** @inheritdoc */
	public get vertexCount() { return this._vertexCount; }
	/** @inheritdoc */
	public get triangleCount() { return this._triangleCount; }

	/** @inheritdoc */
	public get mesh(): MeshLike { return this; }

	/** @hidden */
	public constructor(manager: AssetManager, def: AssetLike) {
		super(manager, def);

		if (!def.mesh) {
			throw new Error("Cannot construct mesh from non-mesh definition");
		}

		this._vertexCount = def.mesh.vertexCount;
		this._triangleCount = def.mesh.triangleCount;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			mesh: {
				vertexCount: this.vertexCount,
				triangleCount: this.triangleCount
			}
		};
	}

	/** @hidden */
	public clearReference(ref: Actor | Asset) {
		super.clearReference(ref);
		if (!(ref instanceof Actor)) return;
	}
}
