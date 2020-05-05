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

----------------------------

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

-----------------------------

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

----------------------------

```cs
string GetVersion(
	string uri
);
```

Returns the stored `version` of the given resource, or `null` if not cached.


IAssetManager
---------------

This class is responsible for maintaining references to active instances of assets used by a particular MRE instance.
Every instance has its own IAssetManager.

----------------------------

```cs

```
