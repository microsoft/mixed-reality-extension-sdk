/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	AssetContainer,
	Material,
	MaterialLike,
	Mesh,
	MeshLike,
	Prefab,
	PrefabLike,
	Sound,
	SoundLike,
	Texture,
	TextureLike
} from '.';
import { Actor } from '..';

/**
 * Instructions for how to load an asset.
 */
export interface AssetSource {
	/**
	 * The format of the asset container.
	 */
	containerType: 'gltf' | 'library';

	/**
	 * The URI at which the asset container can be found.
	 */
	uri?: string;

	/**
	 * A designator for which asset in the container this is. Format will be different for each container type.
	 * For example, a glTF's third material would have "materials/2" as its internalId.
	 */
	internalId?: string;
}

export interface AssetLike {
	/**
	 * The unique id of this asset. Use this to reference this asset in actors, etc.
	 */
	id: string;
	/**
	 * A human-readable string identifying the asset. Not required to be unique, but
	 * can be referenced by name if it is.
	 */
	name?: string;
	/**
	 * Where this asset came from. Used for loading on late-joining clients.
	 */
	source?: AssetSource;

	/** Only populated when this asset is a prefab. An asset will have only one of these types specified. */
	prefab?: Partial<PrefabLike>;
	/** Only populated when this asset is a mesh. An asset will have only one of these types specified. */
	mesh?: Partial<MeshLike>;
	/** Only populated when this asset is a material. An asset will have only one of these types specified. */
	material?: Partial<MaterialLike>;
	/** Only populated when this asset is a texture. An asset will have only one of these types specified. */
	texture?: Partial<TextureLike>;
	/** Only populated when this asset is a sound. An asset will have only one of these types specified. */
	sound?: Partial<SoundLike>;
}

/** The base class for all asset types. */
export abstract class Asset implements AssetLike {
	// tslint:disable:variable-name
	private _id: string;
	private _name: string;
	private _source: AssetSource;
	private _loadedPromise: Promise<void>;
	// tslint:enable:variable-name

	/** @inheritdoc */
	public get id() { return this._id; }

	/** @inheritdoc */
	public get name() { return this._name; }

	/** @inheritdoc */
	public get source() { return this._source; }

	/** @inheritdoc */
	public get prefab(): Prefab { return null; }
	/** @inheritdoc */
	public get mesh(): Mesh { return null; }
	/** @inheritdoc */
	public get material(): Material { return null; }
	/** @inheritdoc */
	public get texture(): Texture { return null; }
	/** @inheritdoc */
	public get sound(): Sound { return null; }

	/** A promise that resolves when the asset is finished loading */
	public get created() { return this._loadedPromise; }

	/** Stores which actors/assets refer to this asset */
	protected references = new Set<Actor | Asset>();

	protected constructor(public container: AssetContainer, def: Partial<AssetLike>) {
		this._id = def.id;
		this._name = def.name;
		this._source = def.source;
	}

	/** @hidden */
	public addReference(ref: Actor | Asset) {
		this.references.add(ref);
	}

	/** @hidden */
	public clearReference(ref: Actor | Asset) {
		this.references.delete(ref);
	}

	/** @hidden */
	public breakReference(ref: Actor | Asset): void { }

	/** @hidden */
	public breakAllReferences() {
		for (const r of this.references) {
			this.breakReference(r);
			this.clearReference(r);
		}
	}

	/** @hidden */
	public setLoadedPromise(p: Promise<void>) {
		this._loadedPromise = p;
	}

	/** @hidden */
	protected toJSON(): AssetLike {
		return {
			id: this._id,
			name: this._name,
			source: this._source
		};
	}

	/** @hidden */
	public copy(from: Partial<AssetLike>): this {
		// tslint:disable:curly
		if (from.id) this._id = from.id;
		if (from.name) this._name = from.name;
		if (from.source) this._source = from.source;
		// tslint:enable:curly

		return this;
	}

	/** @hidden */
	public static Parse(container: AssetContainer, def: AssetLike): Asset {
		if (def.prefab) {
			return new Prefab(container, def);
		} else if (def.mesh) {
			return new Mesh(container, def);
		} else if (def.material) {
			return new Material(container, def);
		} else if (def.texture) {
			return new Texture(container, def);
		} else if (def.sound) {
			return new Sound(container, def);
		} else {
			throw new Error(`Asset ${def.id} is not of a known type.`);
		}
	}
}
