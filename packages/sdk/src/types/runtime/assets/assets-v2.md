# Asset Unloading

This proposal details the API changes required to allow developers to explicitly request
that a given asset (material, texture, sound) be unloaded from memory on the clients,
and unassign all references to them.

Today, assets can be created individually, or created en masse by loading a container
(glTF) for assets. This proposal does not have separate unload APIs for these two cases.
Instead, during synchronization, the adapter will examine which assets are loaded at sync
time, send a container load request if at least one asset from that container is still
loaded, then send unloads for all the other assets. This is processor-inefficient, but
maintains API focus on the concept of assets.

An alternative to the above would be to modify `AssetManager.loadGltf` to allow the
developer to specify which assets are loaded. This is technically possible and solves
the inefficiencies of the above, but requires developer knowledge of glTF internals,
which may not be feasible. As another alternative, the API could require that
container-loaded assets be unloaded as a block. This alternative doesn't really add
any new functionality to the proposal, but reduces multipeer adapter complexity.

## Proposed API Changes

1. `AssetManager.unloadAssets(...assetIds: Asset[]): Promise<void>`

	This method does four things:

	1. It breaks all references to each asset by using the asset's internal reference
		tracker, which will store references to each actor/asset that uses the asset.
	2. It waits for the next batch of updates to propagate to the clients, so the assets
		to be unloaded are not in use during the unload. This wait is done via a new
		context method that resolves a promise when the next update is done.
	3. It sends an `unload-assets` message to clients with the asset IDs. This will
		trigger an `Object.Destroy` in Unity's asset cache, freeing the memory.
	4. It collects success/failure messages from the client, and propagates any errors
		from the client unload.

2. `AssetManager.unloadGroup(group: AssetGroup): Promise<void>`

	This simply calls `unloadAssets` with the IDs of all the assets in the group. If
	alternative two is implemented, this will be the only way to unload container-loaded
	assets. Even if it isn't, this will be more efficient than piecemeal unloading, but
	the developer can decide which is more appropriate.

3. `AssetManager.unloadUnused(): Promise<void>`

	Loops over all assets, finds those that have no references, and calls `unloadAssets`
	with their IDs.

4. `Asset.unload(): Promise<void>`

	Calls `unloadAssets` with the current asset ID.

## Proposed Sync Layer Changes

### Session

Currently the session stores two things related to assets: a list of asset creation
messages (`load-assets` and `create-asset` payloads), and a map of asset updates
since creation by ID. This proposal would replace the creation list with a creation
map indexed by message ID, and would replace the update map with a map of new
SyncAsset structures. These would contain an asset ID, a creation message ID, a flag
indicating if the asset has been uploaded, and a cumulative update message. Session
state would get modified through four functions:

1. `cacheAssetCreationRequest(message: Message<LoadAssets | CreateAsset>): void`

	Store the creation message in the session by message ID.

2. `cacheAssetCreation(assetId: string, creationMessageId: string): void`

	For each asset resulting from a creation message, associate the asset with the
	creation message in the session.

3. `cacheAssetUpdate(update: Message<AssetUpdate>): void`

	Store the update to an asset in the session, or roll it into the creation message
	if possible.

4. `cacheAssetUnload(...assetIds: string[]): void`

	Delete the asset mappings and updates from the session, clean out any unused
	creation messages, and clean out any unloaded SyncAssets still referring to the
	unused creation message.

### Rules

1. On outgoing `load-assets` and `create-asset` messages, call
	`session.cacheAssetCreationRequest`.
2. On incoming `assets-loaded` messages from the authoritative peer, call
	`session.cacheAssetCreation`.
3. On outgoing `asset-update` messages, call `session.cacheAssetUpdate`.
4. On outgoing `unload-assets` messages, call `session.cacheAssetUnload`.

### Client Sync

During the `load-assets` stage of client sync:

1. Send creation messages of all loaded assets.
2. Send unload messages for all container-loaded assets that have been unloaded.
3. Send update messages for all assets whose creation messages couldn't be patched.