/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, AssetContainer, AssetLike, Material, Vector2, Vector2Like } from '..';
import { Patchable, readPath } from '../internal';
import { AssetInternal } from './assetInternal';
// break import cycle
import { Asset } from './asset';

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
	private _uri: string;
	private _resolution = Vector2.One();
	private _wrapU = TextureWrapMode.Repeat;
	private _wrapV = TextureWrapMode.Repeat;
	private _internal = new AssetInternal(this);

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
		if (from.texture && from.texture.uri) {
			this._uri = from.texture.uri;
		}
		if (from.texture && from.texture.resolution) {
			this._resolution = new Vector2(from.texture.resolution.x, from.texture.resolution.y);
		}
		if (from.texture && from.texture.wrapU) {
			this.wrapU = from.texture.wrapU;
		}
		if (from.texture && from.texture.wrapV) {
			this.wrapV = from.texture.wrapV;
		}

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
	public breakReference(ref: Actor | Asset) {
		if (!(ref instanceof Material)) { return; }
		if (ref.mainTexture === this) {
			ref.mainTexture = null;
		}
	}
}
