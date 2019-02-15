/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';

import { Asset, AssetGroup, Material, MaterialLike, Texture, TextureLike } from '.';
import { Context } from '..';
import { log } from '../../../log';
import { LoadSoundOptions } from '../../../sound';
import { ExportedPromise } from '../../../utils/exportedPromise';
import resolveJsonValues from '../../../utils/resolveJsonValues';
import { createForwardPromise, ForwardPromise } from '../../forwardPromise';
import { AssetsLoaded, CreateAsset, CreateColliderType, LoadAssets, LoadSound } from '../../network/payloads';

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
    // tslint:enable:variable-name

    /** @hidden */
    public constructor(public context: Context) {
        this._groups[ManualId] = new AssetGroup(ManualId, null);
    }

    public cleanup() {
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
     * Generate a new texture
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

    private sendCreateAsset<T extends Asset>(asset: T): ForwardPromise<T> {
        this.manualGroup.add(asset);

        const promise = this.sendLoadAssetsPayload({
            type: 'create-asset',
            definition: asset
        } as CreateAsset)
            .then<T>(payload => {
                if (payload.failureMessage || payload.assets.length !== 1) {
                    return Promise.reject(`Creation of asset ${asset.name} failed: ${payload.failureMessage}`);
                }
                return asset.copy(payload.assets[0]);
            });
        this.registerLoadPromise(promise);

        return createForwardPromise(asset, promise);
    }

    public loadSoundAsset(groupName: string, uri: string, options: LoadSoundOptions): ForwardPromise<string> {

        log.error('app', "STARTING LOADSOUNDASSET");
        const soundAssetId = UUID();
        this.enqueueLoadSoundPromise(
            soundAssetId, {
                resolve: () => { /* empty */ },
                reject: () => { /* empty */ },
            });
        const promise = this.sendLoadAssetsPayload({
            type: 'load-sound',
            id: soundAssetId,
            uri
        } as LoadSound)
            .then<string>(payload => {
                if (payload.failureMessage || payload.assets.length !== 1) {
                    this.notifySoundLoaded(soundAssetId, false, payload.failureMessage);
                    return Promise.reject(`Loading sound asset ${uri} failed: ${payload.failureMessage}`);
                }
                // soundAssetId = payload.assets[0].id;
                this.notifySoundLoaded(soundAssetId, true);
            });
        this.registerLoadPromise(promise);

        return createForwardPromise(soundAssetId, promise);
    }

    public unloadSoundAsset(handle: string) {
    }

    public loadSoundPromises: { [name: string]: ExportedPromise[] };

    public notifySoundLoaded(soundAssetId: string, success: boolean, reason?: any): void {
        if (!!this.loadSoundPromises && !!this.loadSoundPromises[soundAssetId]) {
            const loadSoundPromises = this.loadSoundPromises[soundAssetId].splice(0);
            delete this.loadSoundPromises[soundAssetId];
            for (const promise of loadSoundPromises) {
                if (success) {
                    promise.resolve();
                } else {
                    promise.reject(reason);
                }
            }
        }
    }

    public enqueueLoadSoundPromise(soundAssetId: string, promise: ExportedPromise): void {
        if (!this.loadSoundPromises) {
            this.loadSoundPromises = {};
        }
        if (!this.loadSoundPromises[soundAssetId]) {
            this.loadSoundPromises[soundAssetId] = [];
        }
        this.loadSoundPromises[soundAssetId].push(promise);
    }

    public SoundLoaded(soundAssetId: string): Promise<void> {
        if (!this.loadSoundPromises || !this.loadSoundPromises[soundAssetId]) {
            return Promise.resolve();
        } else {
            return new Promise<void>((resolve, reject) =>
                this.enqueueLoadSoundPromise(soundAssetId, { resolve, reject }));
        }
    }

    /**
     * Load the assets in a glTF model by URL, and populate a new group with the result.
     * @param groupName The name of the group to create.
     * @param uri The URI to a glTF model.
     * @returns The promise of a new asset group.
     */
    public loadGltf(groupName: string, uri: string, colliderType: CreateColliderType = 'none'): Promise<AssetGroup> {
        const p = this.loadGltfHelper(groupName, uri, colliderType);
        this.registerLoadPromise(p);
        return p;
    }

    private async loadGltfHelper(
        groupName: string, uri: string, colliderType: CreateColliderType): Promise<AssetGroup> {

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
        } as LoadAssets;

        const response = await this.sendLoadAssetsPayload(payload);
        if (response.failureMessage) {
            throw new Error(response.failureMessage);
        }

        for (const def of response.assets) {
            def.source = group.source;
            const asset = Asset.Parse(this, def);
            group.add(asset);
            this._assets[def.id] = asset;
        }

        return group;
    }

    private registerLoadPromise<T>(promise: Promise<T>): void {
        const ignoreFailure = promise
            .then(() => Promise.resolve())
            .catch(() => Promise.resolve());
        this._ready = this._ready.then(() => ignoreFailure);
    }

    private sendLoadAssetsPayload(payload: LoadAssets | CreateAsset | LoadSound): Promise<AssetsLoaded> {
        return new Promise<AssetsLoaded>((resolve, reject) => {
            this.context.internal.protocol.sendPayload(
                payload, { resolve, reject }
            );
        });
    }
}
