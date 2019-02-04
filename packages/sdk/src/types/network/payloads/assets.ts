/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CreateActorCommon, Payload } from '.';
import { ColliderType } from '../../runtime';
import { AssetLike, AssetSource } from '../../runtime/assets';

export type CreateColliderType = ColliderType | 'none';

/** @hidden */
export type LoadAssets = Payload & {
    type: 'load-assets';
    source: AssetSource;
    colliderType: CreateColliderType;
};

/** @hidden */
export type CreateAsset = Payload & {
    type: 'create-asset';
    definition: AssetLike;
};

/** @hidden */
export type AssetsLoaded = Payload & {
    type: 'assets-loaded';
    assets: AssetLike[];
    failureMessage: string;
};

/** @hidden */
export type AssetUpdate = Payload & {
    type: 'asset-update';
    asset: Partial<AssetLike>;
};

/** @hidden */
export type CreateFromPrefab = CreateActorCommon & {
    type: 'create-from-prefab';
    prefabId: string;
};
