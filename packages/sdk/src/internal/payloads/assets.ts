/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CreateActorCommon, Payload } from '.';
import { AssetLike, AssetSource, ColliderType, CollisionLayer, Guid } from '../..';

export type CreateColliderType = ColliderType | 'none';

/** @hidden */
export type AssetPayloadType
	= 'assets-loaded'
	| 'asset-update'
	| 'create-asset'
	| 'create-from-prefab'
	| 'load-assets'
	| 'unload-assets';

/** @hidden */
export type LoadAssets = Payload & {
	type: 'load-assets';
	containerId: Guid;
	source: AssetSource;
	colliderType: CreateColliderType;
};

/** @hidden */
export type CreateAsset = Payload & {
	type: 'create-asset';
	containerId: Guid;
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
	prefabId: Guid;
	collisionLayer?: CollisionLayer;
};

/** @hidden */
export type UnloadAssets = Payload & {
	type: 'unload-assets';
	containerId: Guid;
};
