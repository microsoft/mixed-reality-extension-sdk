/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetContainer, AssetLike, Material } from '.';
import { Actor } from '..';
import { Vector2, Vector2Like } from '../../../math';
import { observe } from '../../../utils/observe';
import readPath from '../../../utils/readPath';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface TextureLike {
	uri: string;
	resolution: Vector2Like;
	wrapU: TextureWrapMode;
	wrapV: TextureWrapMode;
}

/** How a material should interpret UV coordinates outside the [0,1) range. */
export enum TextureWrapMode {
	/** The texture is tiled for every 1 unit in the UVs. */
	Repeat = 'repeat',
	/** The edge pixels of the texture are stretched out to the bounds of the UVs. */
	Clamp = 'clamp',
	/** The texture is tiled and flipped for every 1 unit in the UVs. */
	Mirror = 'mirror'
}

export class Texture extends Asset implements TextureLike, Patchable<AssetLike> {
	// tslint:disable:variable-name
	private _uri: string;
	private _resolution = Vector2.One();
	private _wrapU = TextureWrapMode.Repeat;
	private _wrapV = TextureWrapMode.Repeat;
	private _internal = new InternalAsset(this);
	// tslint:enable:variable-name

	/** @hidden */
	public get internal() { return this._internal; }

	/** The URI, if any, this texture was loaded from */
	public get uri() { return this._uri; }

	/** The pixel dimensions of the loaded texture */
	public get resolution() { return this._resolution; }

	/** How overflowing UVs are handled horizontally. */
	public get wrapU() { return this._wrapU; }
	public set wrapU(val) { this._wrapU = val; this.textureChanged('wrapU'); }

	/** How overflowing UVs are handled vertically. */
	public get wrapV() { return this._wrapV; }
	public set wrapV(val) { this._wrapV = val; this.textureChanged('wrapV'); }

	/** @inheritdoc */
	public get texture(): Texture { return this; }

	/** INTERNAL USE ONLY. To load a new texture from scratch, use [[AssetManager.createTexture]] */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.texture) {
			throw new Error("Cannot construct texture from non-texture definition");
		}

		if (def.texture.uri) {
			this._uri = def.texture.uri;
		}
		if (def.texture.resolution) {
			this._resolution = new Vector2(def.texture.resolution.x, def.texture.resolution.y);
		}
		if (def.texture.wrapU) {
			this._wrapU = def.texture.wrapU;
		}
		if (def.texture.wrapV) {
			this._wrapV = def.texture.wrapV;
		}
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		// tslint:disable:curly
		super.copy(from);
		if (from.texture && from.texture.uri)
			this._uri = from.texture.uri;
		if (from.texture && from.texture.resolution)
			this._resolution = new Vector2(from.texture.resolution.x, from.texture.resolution.y);
		if (from.texture && from.texture.wrapU)
			this._wrapU = from.texture.wrapU;
		if (from.texture && from.texture.wrapV)
			this._wrapV = from.texture.wrapV;
		// tslint:enable:curly

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			texture: {
				uri: this.uri,
				resolution: this.resolution.toJSON(),
				wrapU: this.wrapU,
				wrapV: this.wrapV
			}
		};
	}

	private textureChanged(...path: string[]): void {
		if (this.internal.observing) {
			this.container.context.internal.incrementGeneration();
			this.internal.patch = this.internal.patch || { texture: {} } as AssetLike;
			readPath(this, this.internal.patch.texture, ...path);
		}
	}

	/** @hidden */
	public clearReference(ref: Actor | Asset) {
		super.clearReference(ref);
		if (!(ref instanceof Material)) return;
		if (ref.mainTexture === this) {
			ref.mainTexture = null;
		}
	}
}
