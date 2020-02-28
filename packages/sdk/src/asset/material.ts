/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Actor,
	AssetContainer,
	AssetLike,
	Color3,
	Color4,
	Color4Like,
	Guid,
	Vector2,
	Vector2Like,
	ZeroGuid
} from '..';
import {
	observe,
	Patchable,
	readPath
} from '../internal';
import { AssetInternal } from './assetInternal';
// break import cycle
import { Asset } from './asset';

/**
 * Describes the properties of a Material.
 */
export interface MaterialLike {
	/** The base color of this material. */
	color: Partial<Color4Like>;
	/** The main (albedo) texture asset ID */
	mainTextureId: Guid;
	/** The main texture's offset from default */
	mainTextureOffset: Vector2Like;
	/** The main texture's scale from default */
	mainTextureScale: Vector2Like;
	/** How the color/texture's alpha channel should be handled */
	alphaMode: AlphaMode;
	/** Visibility threshold in masked alpha mode */
	alphaCutoff: number;
}

/**
 * Controls how transparency is handled.
 */
export enum AlphaMode {
	/** The object is rendered opaque, and transparency info is discarded. */
	Opaque = 'opaque',
	/**
	 * Any parts with alpha above a certain cutoff ([[Material.alphaCutoff]])
	 * will be rendered solid. Everything else is fully transparent.
	 */
	Mask = 'mask',
	/**
	 * A pixel's transparency is directly proportional to its alpha value.
	 */
	Blend = 'blend'
}

/**
 * Represents a material on a mesh.
 */
export class Material extends Asset implements MaterialLike, Patchable<AssetLike> {
	private _color = Color4.FromColor3(Color3.White(), 1.0);
	private _mainTextureId = ZeroGuid;
	private _mainTextureOffset = Vector2.Zero();
	private _mainTextureScale = Vector2.One();
	private _alphaMode = AlphaMode.Opaque;
	private _alphaCutoff = 0.5;
	private _internal = new AssetInternal(this);

	/** @hidden */
	public get internal() { return this._internal; }

	/** @inheritdoc */
	public get color() { return this._color; }
	public set color(value) { if (value) { this._color.copy(value); } }

	/** @returns A shared reference to this material's texture asset */
	public get mainTexture() {
		return this.container.context.internal.lookupAsset(this._mainTextureId)?.texture;
	}
	public set mainTexture(value) {
		this.mainTextureId = value?.id ?? ZeroGuid;
	}

	/** @inheritdoc */
	public get mainTextureId() { return this._mainTextureId; }
	public set mainTextureId(value) {
		if (!value) {
			value = ZeroGuid;
		}
		if (!this.container.context.internal.lookupAsset(value)) {
			value = ZeroGuid; // throw?
		}

		if (value === this._mainTextureId) { return; }

		if (this.mainTexture) {
			this.mainTexture.clearReference(this);
		}
		this._mainTextureId = value;
		if (this.mainTexture) {
			this.mainTexture.addReference(this);
		}
		this.materialChanged('mainTextureId');
	}

	/** @inheritdoc */
	public get mainTextureOffset() { return this._mainTextureOffset; }
	public set mainTextureOffset(value) { if (value) { this._mainTextureOffset.copy(value); } }

	/** @inheritdoc */
	public get mainTextureScale() { return this._mainTextureScale; }
	public set mainTextureScale(value) { if (value) { this._mainTextureScale.copy(value); } }

	/** @inheritdoc */
	public get alphaMode() { return this._alphaMode; }
	public set alphaMode(value) { this._alphaMode = value; this.materialChanged('alphaMode'); }

	/** @inheritdoc */
	public get alphaCutoff() { return this._alphaCutoff; }
	public set alphaCutoff(value) { this._alphaCutoff = value; this.materialChanged('alphaCutoff'); }

	/** @inheritdoc */
	public get material(): Material { return this; }

	/** INTERNAL USE ONLY. To create a new material from scratch, use [[AssetManager.createMaterial]]. */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.material) {
			throw new Error("Cannot construct material from non-material definition");
		}

		this.copy(def);

		// material patching: observe the nested material properties
		// for changed values, and write them to a patch
		observe({
			target: this._color,
			targetName: 'color',
			notifyChanged: (...path: string[]) => this.materialChanged(...path)
		});
		observe({
			target: this._mainTextureOffset,
			targetName: 'mainTextureOffset',
			notifyChanged: (...path: string[]) => this.materialChanged(...path)
		});
		observe({
			target: this._mainTextureScale,
			targetName: 'mainTextureScale',
			notifyChanged: (...path: string[]) => this.materialChanged(...path)
		});
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		super.copy(from);
		if (from.material) {
			if (from.material.color) {
				this.color.copy(from.material.color);
			}
			if (from.material.mainTextureOffset) {
				this.mainTextureOffset.copy(from.material.mainTextureOffset);
			}
			if (from.material.mainTextureScale) {
				this.mainTextureScale.copy(from.material.mainTextureScale);
			}
			if (from.material.mainTextureId) {
				this.mainTextureId = from.material.mainTextureId;
			}
			if (from.material.alphaMode) {
				this.alphaMode = from.material.alphaMode;
			}
			if (from.material.alphaCutoff) {
				this.alphaCutoff = from.material.alphaCutoff;
			}
		}

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			material: {
				color: this.color.toJSON(),
				mainTextureId: this.mainTextureId,
				mainTextureOffset: this.mainTextureOffset.toJSON(),
				mainTextureScale: this.mainTextureScale.toJSON(),
				alphaMode: this.alphaMode,
				alphaCutoff: this.alphaCutoff
			}
		};
	}

	private materialChanged(...path: string[]): void {
		if (this.internal.observing) {
			this.container.context.internal.incrementGeneration();
			this.internal.patch = this.internal.patch || { material: {} } as AssetLike;
			readPath(this, this.internal.patch.material, ...path);
		}
	}

	/** @hidden */
	public breakReference(ref: Actor | Asset) {
		if (!(ref instanceof Actor)) { return; }
		if (ref.appearance.material === this) {
			ref.appearance.material = null;
		}
	}
}
