Unity Asset Management
========================

Goals:

1. Minimize asset downloading and conversion/preprocessing.
2. Balance memory footprint against load performance, and ensure no unreferenced assets stay in memory.
2. Maximize asset reuse, so engines can instance and optimize draw calls.


IAssetCache
------------

This is a system-wide class instance that is responsible for caching assets beyond the lifetime of a single MRE
instance. This could possibly be backed by persistent storage instead of memory. This is primarily intended
for assets loaded via an HTTP request.

### StoreAssets

```cs
void StoreAssets(
	string uri,
	IEnumerable<UnityEngine.Object> assets = null,
	string version = null
);
```

If all arguments are not null, and either the cache contains no assets for the resource, or the cached version
does not match what is provided, this method stores all provided assets in the cache, overwriting any currently
cached assets. Otherwise, the assets and version arguments are ignored, and the internal reference counter for this
resource is decremented.

* `uri` - The resource identifier
* `assets` - The collection of assets generated from the given resource
* `version` - The version of the loaded resource. Will typically be the HTTP response's `ETag` header.

### LeaseAssets

```cs
Task<IEnumerable<UnityEngine.Object>> LeaseAssets(
	string uri,
	string ifMatches = null
);
```

Asynchronously return the cached assets at the given URI, and increment the internal reference counter for this
resource. Will return `null` if no assets are cached for that resource, or if `ifMatches` does not match the
stored assets' `version`. This needs to be async in case the asset needs to be loaded from persistent storage.

* `uri` - The resource identifier
* `ifMatches` - If provided, assets will be returned only if the resource version matches this argument.

### GetVersion

```cs
string GetVersion(string uri);
```

Returns the stored `version` of the given resource, or `null` if not cached. We'll need this for `If-Not-Match`
HTTP headers.


AssetManager
---------------

This class is responsible for maintaining references to active instances of assets used by a particular MRE instance.
Every instance has its own IAssetManager.

### AssetMetadata

```cs
public struct AssetMetadata {
	Guid Id;
	UnityEngine.Object Asset;
	ColliderGeometry ColliderGeometry;
	AssetSource Source;
}
```

Stores all the necessary info about an asset, including where it came from. `Source` will be null if this is not
a shared asset, i.e. is a one-off creation of an MRE, or is a modified copy of something from the asset cache.

### CacheRootGO

### EmptyTemplate

### Get

```cs
AssetMetadata Get(Guid? id);
```

### LookupByObject

```cs
AssetMetadata LookupByObject(UnityEngine.Object asset);
```

Expected flow: glTF
=====================

Let's say I want to load a glTF file. In this new two-tier design, the steps are:

1. Call `IAssetCache.GetVersion(uri)`. If there is a cached version (i.e. the return
	is not null), add this version to an `If-None-Match` header of Step 2's request.
2. Make an HTTP request for the resource.
3. If the response code is 200, process the result through the glTF loader, and call `IAssetCache.StoreAssets` with
	the URI, the processed objects, and the `ETag` of the HTTP response.
4. Call `IAssetCache.LeaseAssets(uri)` to retrieve either the newly loaded objects or the old cached ones, and
	increment the internal reference counter so this resource doesn't go cold in the cache.
5. Convert the `UnityEngine.Object`s into assets by assigning an ID and filling out the rest of the asset metadata.
6. Call `IAssetManager.CacheAsset` on each of the new assets, marking each as "shared".
7. Return the new asset descriptions to the server.

If I want to then modify a loaded asset from this batch:

1. Call `IAssetManager.GetAsset
