/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';

import {
	Asset, AssetSource,
	Material, MaterialLike,
	Mesh,
	Prefab,
	Sound, SoundLike,
	Texture, TextureLike
} from '.';
import { Context } from '..';
import { log } from '../../../log';
import resolveJsonValues from '../../../utils/resolveJsonValues';
import * as Payloads from '../../network/payloads';

/**
 * The root object of the MRE SDK's asset system. Once you create an AssetContainer,
 * you can create new materials, textures, or sounds from scratch, or load glTF
 * files for their assets.
 */
export class AssetContainer {
	// tslint:disable:variable-name
	private _id: string;
	private _assets: { [id: string]: Asset } = {};
	// tslint:enable:variable-name

	/** @hidden */
	public get id() { return this._id; }

	/** A mapping of asset IDs to assets in this container */
	public get assetsById() { return Object.freeze({ ...this._assets }); }
	/** A list of all assets in this container */
	public get assets() { return Object.values(this._assets); }
	/** A list of all materials in this container */
	public get materials() { return this.assets.filter(a => a instanceof Material) as Material[]; }
	/** A list of all meshes in this container */
	public get meshes() { return this.assets.filter(a => a instanceof Mesh) as Mesh[]; }
	/** A list of all prefabs in this container */
	public get prefabs() { return this.assets.filter(a => a instanceof Prefab) as Prefab[]; }
	/** A list of all sounds in this container */
	public get sounds() { return this.assets.filter(a => a instanceof Sound) as Sound[]; }
	/** A list of all textures in this container */
	public get textures() { return this.assets.filter(a => a instanceof Texture) as Texture[]; }

	/** Create a new asset container */
	public constructor(public context: Context) {
		this._id = UUID();
		context.internal.assetContainers.add(this);
	}

	/**
	 * Generate a new material
	 * @param name The new material's name
	 * @param definition The initial material properties
	 */
	public createMaterial(name: string, definition: Partial<MaterialLike>): Material {
		const mat = new Material(this, {
			id: UUID(),
			name,
			material: resolveJsonValues(definition)
		});
		mat.setLoadedPromise(this.sendCreateAsset(mat));
		return mat;
	}

	/**
	 * Load an image file and generate a new texture asset
	 * @param name The new texture's name
	 * @param definition The initial texture properties. The `uri` property is required.
	 */
	public createTexture(name: string, definition: Partial<TextureLike>): Texture {
		const tex = new Texture(this, {
			id: UUID(),
			name,
			texture: resolveJsonValues(definition)
		});
		tex.setLoadedPromise(this.sendCreateAsset(tex));
		return tex;
	}

	/**
	 * Load an audio file and generate a new sound asset
	 * @param name The new sound's name
	 * @param definition The initial sound properties. The `uri` property is required.
	 */
	public createSound(name: string, definition: Partial<SoundLike>): Sound {
		const sound = new Sound(this, {
			id: UUID(),
			name,
			sound: resolveJsonValues(definition)
		});
		sound.setLoadedPromise(this.sendCreateAsset(sound));
		return sound;
	}

	/**
	 * Load the assets in a glTF file by URL, and this container with the result.
	 * @param uri The URI to a glTF model.
	 * @param colliderType The shape of the generated prefab collider.
	 * @returns A promise that resolves with the list of loaded assets.
	 */
	public async loadGltf(uri: string, colliderType: Payloads.CreateColliderType): Promise<Asset[]> {
		if (!this._assets) {
			throw new Error("Cannot load new assets into an unloaded container!");
		}

		const source = {
			containerType: 'gltf',
			uri
		} as AssetSource;

		const payload = {
			type: 'load-assets',
			containerId: this.id,
			source,
			colliderType
		} as Payloads.LoadAssets;

		const response = await this.sendPayloadAndGetReply<Payloads.LoadAssets, Payloads.AssetsLoaded>(payload);
		if (response.failureMessage) {
			throw new Error(response.failureMessage);
		}

		const newAssets: Asset[] = [];
		for (const def of response.assets) {
			def.source = source;
			const asset = Asset.Parse(this, def);
			this._assets[def.id] = asset;
			newAssets.push(asset);
		}
		return newAssets;
	}

	/** Break references to all assets in the container, and unload them to free memory */
	public unload(): void {
		for (const a of this.assets) {
			a.clearAllReferences();
		}
		this.context.internal.assetContainers.delete(this);
		this._assets = null;

		this.context.internal.nextUpdate().then(() => {
			this.context.internal.protocol.sendPayload({
				type: 'unload-assets',
				containerId: this.id
			} as Payloads.UnloadAssets);
		})
		.catch(err => log.error('app', err));
	}

	private async sendCreateAsset(asset: Asset): Promise<void> {
		if (!this._assets) {
			throw new Error("Cannot load new assets into an unloaded container!");
		}

		this._assets[asset.id] = asset;

		const reply = await this.sendPayloadAndGetReply<Payloads.CreateAsset, Payloads.AssetsLoaded>({
			type: 'create-asset',
			containerId: this.id,
			definition: resolveJsonValues(asset)
		});

		if (reply.failureMessage || reply.assets.length !== 1) {
			throw new Error(`Creation/Loading of asset ${asset.name} failed: ${reply.failureMessage}`);
		}
	}

	private sendPayloadAndGetReply<T extends Payloads.Payload, U extends Payloads.Payload>(payload: T): Promise<U> {
		return new Promise<U>((resolve, reject) => {
			this.context.internal.protocol.sendPayload(
				payload, { resolve, reject }
			);
		});
	}
}
