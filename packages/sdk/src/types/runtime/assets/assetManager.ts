/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetGroup } from '.';
import { Context } from '..';
import { AssetsLoaded, LoadAssets } from '../../network/payloads';

/**
 * A per-context singleton that manages all of an app's assets. Create a new asset group
 * by calling a load method (e.g. [[loadGltf]]), view the group's assets via [[group]],
 * and use the assets by ID on actors (e.g. [[Actor.CreateFromPrefab]]).
 */
export class AssetManager {
    private assets: { [id: string]: Asset } = {};
    private groups: { [k: string]: AssetGroup } = {};
    private inFlightLoads: { [k: string]: Promise<AssetGroup> } = {};

    /** @hidden */
    public constructor(private context: Context) { }

    /** Fetch a group by name. */
    public group(name: string) { return this.groups[name]; }

    /** Fetch an asset by id. */
    public byId(id: string) { return this.assets[id]; }

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

    /**
     * Load the assets in a glTF model by URL, and populate a new group with the result.
     * @param groupName The name of the group to create.
     * @param url The URL to a glTF model.
     * @returns The promise of a new asset group.
     */
    public loadGltf(groupName: string, url: string): Promise<AssetGroup> {
        if (this.groups[groupName]) {
            throw new Error(
                `Group name ${groupName} is already in use. Unload the old group, or choose a different name.`);
        }

        const p = this.loadGltfHelper(groupName, url);
        const remove = (ag: AssetGroup) => { delete this.inFlightLoads[groupName]; return ag; };
        this.inFlightLoads[groupName] = p.then(remove, remove);

        return this.inFlightLoads[groupName];
    }

    private async loadGltfHelper(groupName: string, url: string): Promise<AssetGroup> {
        const group = new AssetGroup(groupName, {
            containerType: 'gltf',
            uri: url
        });

        const payload = {
            type: 'load-assets',
            source: group.source
        } as LoadAssets;

        const response = await this.sendLoadAssetsPayload(payload);

        for (const def of response.assets) {
            def.source = group.source;
            let asset = Asset.Parse(this, def);
            group.add(asset);
            this.assets[def.id] = asset;
        }

        this.groups[groupName] = group;
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
