/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';

import { Asset, AssetGroup, Material, MaterialLike, Sound, SoundLike, Texture, TextureLike } from '.';
import { Context } from '..';
import { log } from '../../../log';
import { ExportedPromise } from '../../../utils/exportedPromise';
import resolveJsonValues from '../../../utils/resolveJsonValues';
import { createForwardPromise, ForwardPromise } from '../../forwardPromise';
import * as Payloads from '../../network/payloads';

// tslint:disable-next-line:variable-name
const ManualId = '__manual__';

/**
 * A per-context singleton that manages all of an app's assets. Create a new asset group
 * by calling a load method (e.g. [[loadGltf]]), view the group's assets via [[groups]],
 * and use the assets by ID on actors (e.g. [[Actor.CreateFromPrefab]]).
 */
export class AssetManager {
	// tslint:disable:variable-name
	private _assets: { [id: string]: Asset } = {};
	private _groups: { [k: string]: AssetGroup } = {};
	private _ready = Promise.resolve();
	private _loadAssetPromises: { [name: string]: ExportedPromise[] } = {};

	// tslint:enable:variable-name

	/** @hidden */
	public constructor(public context: Context) {
		this._groups[ManualId] = new AssetGroup(ManualId, null);
	}

	/** Fetch a group by name. */
	public get groups() { return Object.freeze({ ...this._groups }); }

	/** Get the group of individually-created assets */
	public get manualGroup() { return this._groups[ManualId]; }

	/** Fetch an asset by id. */
	public get assets() { return Object.freeze({ ...this._assets }); }

	/**
	 * @returns A promise that resolves when all pending asset load requests have been
	 * settled, successfully or otherwise. Listen to the individual load promises to
	 * catch failures.
	 */
	public get ready() { return this._ready; }

	/**
	 * Generate a new material
	 * @param name The new material's name
	 * @param definition The initial material properties
	 */
	public createMaterial(name: string, definition: Partial<MaterialLike>): ForwardPromise<Material> {
		return this.sendCreateAsset(new Material(this, {
			id: UUID(),
			name,
			material: resolveJsonValues(definition)
		}));
	}

	/**
	 * Load an image file and generate a new texture asset
	 * @param name The new texture's name
	 * @param definition The initial texture properties. The `uri` property is required.
	 */
	public createTexture(name: string, definition: Partial<TextureLike>): ForwardPromise<Texture> {
		return this.sendCreateAsset(new Texture(this, {
			id: UUID(),
			name,
			texture: resolveJsonValues(definition)
		}));
	}

	/**
	 * Load an audio file and generate a new sound asset
	 * @param name The new sound's name
	 * @param definition The initial sound properties. The `uri` property is required.
	 */
	public createSound(name: string, definition: Partial<SoundLike>): ForwardPromise<Sound> {
		return this.sendCreateAsset(new Sound(this, {
			id: UUID(),
			name,
			sound: resolveJsonValues(definition)
		}));
	}

	private sendCreateAsset<T extends Asset>(asset: T): ForwardPromise<T> {
		this.manualGroup.add(asset);
		this._assets[asset.id] = asset;

		this.enqueueLoadAssetPromise(
			asset.id, {
				resolve: () => { /* empty */ },
				reject: () => { /* empty */ },
			});
		const promise = this.sendPayload<Payloads.CreateAsset, Payloads.AssetsLoaded>({
			type: 'create-asset',
			definition: resolveJsonValues(asset)
		})
			.then<T>(payload => {
				if (payload.failureMessage || payload.assets.length !== 1) {
					this.notifyAssetLoaded(asset.id, false, payload.failureMessage);
					return Promise.reject(`Creation/Loading of asset ${asset.name} failed: ${payload.failureMessage}`);
				}
				this.notifyAssetLoaded(asset.id, true);
				return asset.copy(payload.assets[0]);
			});
		this.registerLoadPromise(promise);

		return createForwardPromise(asset, promise);
	}

	/**
	 * Unload these assets from client memory, and clear all references to them.
	 * @param assets The assets to unload
	 */
	public async unloadAssets(...assets: Asset[]): Promise<void> {
		// unassign assets
		for (const a of assets) {
			a.clearAllReferences();
		}

		// wait for those unassignments to be processed by clients
		await this.context.internal.nextUpdate();

		// send unload message
		const resultsPayload = await this.sendPayload<Payloads.UnloadAssets, Payloads.MultiOperationResult>({
			type: 'unload-assets',
			assetIds: assets.map(a => a.id)
		} as Payloads.UnloadAssets);

		// check for unload failures
		const results = resultsPayload.results.map((result, i) => ({
			id: assets[i].id,
			name: assets[i].name,
			code: result.resultCode,
			message: result.message }));
		const errors = results.filter(result => result.code !== 'success');

		// compose error message if any fail
		if (errors.length > 0) {
			let message = "The following assets could not be unloaded:";
			for (const e of errors) {
				message += `\n${e.id} (${e.name}) - ${e.code}: ${e.message}`;
			}
			throw new Error(message);
		}
	}

	public unloadGroup(group: AssetGroup) {
		return this.unloadAssets(...group);
	}

	private notifyAssetLoaded(assetId: string, success: boolean, reason?: any): void {
		if (!!this._loadAssetPromises && !!this._loadAssetPromises[assetId]) {
			const loadAssetPromises = this._loadAssetPromises[assetId].splice(0);
			delete this._loadAssetPromises[assetId];
			for (const promise of loadAssetPromises) {
				if (success) {
					promise.resolve();
				} else {
					promise.reject(reason);
				}
			}
		}
	}

	private enqueueLoadAssetPromise(assetId: string, promise: ExportedPromise): void {
		if (!this._loadAssetPromises[assetId]) {
			this._loadAssetPromises[assetId] = [];
		}
		this._loadAssetPromises[assetId].push(promise);
	}

	/**
	 * A promise that resolves when a specific asset has settled, successfully or otherwise
	 * @param assetId The asset's id
	 */
	public assetLoaded(assetId: string): Promise<void> {
		if (!this._loadAssetPromises || !this._loadAssetPromises[assetId]) {
			return Promise.resolve();
		} else {
			return new Promise<void>((resolve, reject) =>
				this.enqueueLoadAssetPromise(assetId, { resolve, reject }));
		}
	}

	/**
	 * Load the assets in a glTF model by URL, and populate a new group with the result.
	 * @param groupName The name of the group to create.
	 * @param uri The URI to a glTF model.
	 * @returns The promise of a new asset group.
	 */
	public loadGltf(
		groupName: string,
		uri: string,
		colliderType: Payloads.CreateColliderType = 'none'
	): Promise<AssetGroup> {
		const p = this.loadGltfHelper(groupName, uri, colliderType);

		this.registerLoadPromise(p);
		return p;
	}

	private async loadGltfHelper(
		groupName: string, uri: string, colliderType: Payloads.CreateColliderType): Promise<AssetGroup> {

		const id = UUID();
		this.enqueueLoadAssetPromise(
			id, {
				resolve: () => { /* empty */ },
				reject: () => { /* empty */ },
			});

		let group: AssetGroup;
		if (this.groups[groupName]) {
			group = this.groups[groupName];
			if (group.source.containerType === 'gltf' && group.source.uri === uri) {
				return group;
			} else {
				throw new Error(
					`Group name ${groupName} is already in use. Unload the old group, or choose a different name.`);
			}
		}

		group = new AssetGroup(groupName, {
			containerType: 'gltf',
			uri
		});
		this._groups[groupName] = group;

		const payload = {
			type: 'load-assets',
			source: group.source,
			colliderType
		} as Payloads.LoadAssets;

		const response = await this.sendPayload<Payloads.LoadAssets, Payloads.AssetsLoaded>(payload);
		if (response.failureMessage) {
			this.notifyAssetLoaded(id, false, response.failureMessage);
			throw new Error(response.failureMessage);
		}

		for (const def of response.assets) {
			def.source = group.source;
			const asset = Asset.Parse(this, def);
			group.add(asset);
			this._assets[def.id] = asset;
		}
		this.notifyAssetLoaded(id, true);
		return group;
	}

	private registerLoadPromise<T>(promise: Promise<T>): void {
		const ignoreFailure = promise
			.then(() => Promise.resolve())
			.catch(() => Promise.resolve());
		this._ready = this._ready.then(() => ignoreFailure);
	}

	private sendPayload<T extends Payloads.Payload, U extends Payloads.Payload>(payload: T): Promise<U> {
		return new Promise<U>((resolve, reject) => {
			this.context.internal.protocol.sendPayload(
				payload, { resolve, reject }
			);
		});
	}
}
