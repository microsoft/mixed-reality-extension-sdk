/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetGroup, Material, MaterialLike, Texture, TextureLike } from '.';
import { Context } from '..';
import { AssetsLoaded, CreateColliderType, LoadAssets } from '../../network/payloads';

/**
 * A per-context singleton that manages all of an app's assets. Create a new asset group
 * by calling a load method (e.g. [[loadGltf]]), view the group's assets via [[group]],
 * and use the assets by ID on actors (e.g. [[Actor.CreateFromPrefab]]).
 */
export class AssetManager {
    // tslint:disable:variable-name
    private _assets: { [id: string]: Asset } = {};
    private _groups: { [k: string]: AssetGroup } = {};
    // tslint:enable:variable-name
    private inFlightLoads: { [k: string]: Promise<AssetGroup> } = {};

    /** @hidden */
    public constructor(public context: Context) { }

    public cleanup() {
    }
    /** Fetch a group by name. */
    public get groups() { return Object.freeze({ ...this._groups }); }

    /** Fetch an asset by id. */
    public get assets() { return Object.freeze({ ...this._assets }); }

    /**
     * @returns A promise that resolves when all pending asset load requests have been
     * settled (success or failure).
     */
    public ready(): Promise<void> {
        return new Promise((resolve, reject) => {

            let waiting = Object.keys(this.inFlightLoads).length;
            let shouldReject = false;
            function decrementRefsAndTest(rejected: boolean) {
                shouldReject = shouldReject || rejected;
                waiting--;
                if (waiting <= 0) {
                    shouldReject ? reject() : resolve();
                }
            }

            for (const [k, p] of Object.entries(this.inFlightLoads)) {
                p.then(ag => decrementRefsAndTest(false))
                    .catch(e => decrementRefsAndTest(true));
            }
        });
    }

    public createMaterial(groupName: string, definition: Partial<MaterialLike>): Promise<Material> {

    }

    public createTexture(groupName: string, uri: string, definition?: Partial<TextureLike>): Promise<Texture> {

    }

    /**
     * Load the assets in a glTF model by URL, and populate a new group with the result.
     * @param groupName The name of the group to create.
     * @param url The URL to a glTF model.
     * @returns The promise of a new asset group.
     */
    public loadGltf(groupName: string, url: string, colliderType: CreateColliderType = 'none'): Promise<AssetGroup> {
        if (this.groups[groupName]) {
            throw new Error(
                `Group name ${groupName} is already in use. Unload the old group, or choose a different name.`);
        }

        const p = this.loadGltfHelper(groupName, url, colliderType);
        this.inFlightLoads[groupName] = p.then(
            (ag: AssetGroup) => { delete this.inFlightLoads[groupName]; return ag; },
            (err) => { delete this.inFlightLoads[groupName]; return Promise.reject(err); });

        return this.inFlightLoads[groupName];
    }

    private async loadGltfHelper(
        groupName: string, url: string, colliderType: CreateColliderType): Promise<AssetGroup> {
        const group = new AssetGroup(groupName, {
            containerType: 'gltf',
            uri: url
        });

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

        this._groups[groupName] = group;
        return group;
    }

    private sendLoadAssetsPayload(payload: LoadAssets): Promise<AssetsLoaded> {
        return new Promise<AssetsLoaded>((resolve, reject) => {
            this.context.internal.protocol.sendPayload(
                payload, { resolve, reject }
            );
        });
    }
}
