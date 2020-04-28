/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	AssetContainer,
	AssetLike,
	AssetUserType,
	PrimitiveDefinition,
	Vector3,
	Vector3Like,
} from '..';
import { Patchable } from '../internal';
import { AssetInternal } from './assetInternal';
// break import cycle
import { Asset } from './asset';

/** Describes the properties of a mesh */
export interface MeshLike {
	/** The number of vertices in this mesh. */
	vertexCount: number;
	/** The number of triangles in this mesh. */
	triangleCount: number;
	/** The size of the axis-aligned box that exactly contains the mesh */
	boundingBoxDimensions: Vector3Like;
	/** The center of the axis-aligned box that exactly contains the mesh */
	boundingBoxCenter: Vector3Like;

	/** If this mesh is a primitive, the primitive's description */
	primitiveDefinition: PrimitiveDefinition;
}

/** Represents a mesh on an actor */
export class Mesh extends Asset implements MeshLike, Patchable<AssetLike> {
	private _internal = new AssetInternal(this);
	private _vertexCount: number;
	private _triangleCount: number;
	private _dimensions: Vector3 = new Vector3();
	private _center: Vector3 = new Vector3();
	private _primDef: PrimitiveDefinition = null;

	/** @hidden */
	public get internal() { return this._internal; }

	/** @inheritdoc */
	public get vertexCount() { return this._vertexCount; }
	/** @inheritdoc */
	public get triangleCount() { return this._triangleCount; }
	/** @inheritdoc */
	public get boundingBoxDimensions() { return this._dimensions; }
	/** @inheritdoc */
	public get boundingBoxCenter() { return this._center; }
	/** @inheritdoc */
	public get primitiveDefinition() { return this._primDef; }

	/** @inheritdoc */
	public get mesh(): Mesh { return this; }

	/** @hidden */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.mesh) {
			throw new Error("Cannot construct mesh from non-mesh definition");
		}

		this.copy(def);
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		super.copy(from);
		if (from.mesh?.vertexCount !== undefined) { this._vertexCount = from.mesh.vertexCount; }
		if (from.mesh?.triangleCount !== undefined) { this._triangleCount = from.mesh.triangleCount; }
		if (from.mesh?.boundingBoxDimensions) { this._dimensions.copy(from.mesh.boundingBoxDimensions); }
		if (from.mesh?.boundingBoxCenter) { this._center.copy(from.mesh.boundingBoxCenter); }
		if (from.mesh?.primitiveDefinition) { this._primDef = from.mesh.primitiveDefinition; }

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			mesh: {
				vertexCount: this.vertexCount,
				triangleCount: this.triangleCount,
				boundingBoxDimensions: this.boundingBoxDimensions,
				boundingBoxCenter: this.boundingBoxCenter,
				primitiveDefinition: this.primitiveDefinition
			}
		};
	}

	/** @hidden */
	public breakReference(ref: AssetUserType) {
		if (!(ref instanceof Actor)) { return; }

		if (ref.appearance.mesh === this) {
			ref.appearance.mesh = null;
		}
	}
}
