# MRE Mesh Support

I propose the addition of a new Mesh asset type. Technically the type is already defined but it's only a stub.
The asset would look like this:

```ts
interface MeshLike {
	/** The number of vertices in this mesh. */
	vertexCount: number;
	/** The number of triangles in this mesh. */
	triangleCount: number;
	/** The size of the axis-aligned box that exactly contains the mesh. */
	boundingBoxDimensions: Vector3Like;
	/** The center of the axis-aligned box that exactly contains the mesh. */
	boundingBoxCenter: Vector3Like;

	/** If this mesh is a primitive, the primitive's shape and size. */
	primitiveDefinition: PrimitiveDefinition;
}
```

## Generation

Instances of this asset type would be created from either one of the primitive generators:

```ts
class AssetContainer {
	public createSphereMesh(name: string, radius: number, uSegments = 36, vSegments = 18): Mesh { }
	public createBoxMesh(name: string, width: number, height: number, depth: number): Mesh { }
	public createCapsuleMesh(
		name: string, height: number, radius: number,
		direction: 'x' | 'y' | 'z' = 'y', uSegments = 36, vSegments = 18
	): Mesh { }
	public createCylinderMesh(
		name: string, height: number, radius: number,
		direction: 'x' | 'y' | 'z' = 'y', uSegments = 36
	): Mesh { }
	public createPlaneMesh(name: string, width: number, height: number, uSegments = 1, vSegments = 1): Mesh { }

	// generic form
	public createPrimitiveMesh(name: string, definition: PrimitiveDefinition): Mesh { }
}
```

Or loaded from `AssetContainer.loadGltf`, and returned with that list of assets.

## Usage

A `meshId` property would be added to `AppearanceLike`, and a corresponding `mesh` property to `Appearance`.

Assigning a new primitive mesh to an existing actor:

```ts
const assets: MRE.AssetContainer;
const actor: MRE.Actor;
actor.appearance.mesh = assets.createBoxPrimitive('box', 1, 1, 1);
```

Creating a new actor with a new primitive mesh:

```ts
const context: MRE.Context;
const assets: MRE.AssetContainer;
MRE.Actor.CreateEmpty(context, {
	name: 'box',
	appearance: {
		meshId: assets.createBoxPrimitive('box', 1, 1, 1).id
	}
});
```

Using a mesh from a glTF:

```ts
const assets: MRE.AssetContainer;
const actor: MRE.Actor;
await assets.loadGltf('myMesh.gltf');
actor.appearance.mesh = assets.meshes.find(m => m.name === "Asset I want") || assets.meshes[0];
```

## Colliders

Today, colliders are created in one of three ways. On actor creation:

1. Through the `addCollider` option of `Actor.CreatePrimitive`, which takes a boolean. The shape and size of
	the resulting collider is determined by the primitive definition. The collider is built Unity-side, then
	its description is returned in the generated actor patch.
2. Through the `colliderType` option of `Actor.CreateFromGltf`, which accepts any of our known collider types:
	`box`, `sphere`, `mesh`, `capsule`, or `none`. Of these, UnityGLTF only knows how to process `box` and `mesh`;
	the others will be ignored. A separate collider will be generated for each mesh in the glTF. For `box` types,
	the size is determined by the axis-aligned bounding box of the mesh. The colliders are built Unity-side, then
	their descriptions are returned in the generated actor patches.

Or at runtime:

3. Through an Actor instance's `setCollider(colliderType: 'box' | 'sphere', ...moreOptions)` method, which takes
	the shape, size, and options of the desired collider, and adds it to the accumulating actor patch. Next
	`actor-update`, that collider patch is converted into a Unity collider of the appropriate type.

**Note**: Mesh colliders in Unity are [expensive to generate, expensive to evaluate, and have a laundry list of
caveats](https://docs.unity3d.com/Manual/class-MeshCollider.html). For this reason they generally advise against
adding mesh colliders at all at runtime. So if we want MREs to have the ability to produce mesh colliders at all,
we should be prepared for those performance penalties. For this reason, only `CreateFromGltf` can generate mesh
colliders, though I suspect this isn't great either.

**Note**: `Actor.CreatePrimitive` and `Actor.CreateFromGltf` are largely redundant with the introduction of assignable
meshes, and may interfere with the functioning of mesh assignment without careful engineering. The following
collider API proposal is designed primarily for use with `Actor.CreateEmpty`. See
[Other Considerations](#removing-createprimitive-and-createfromgltf).

Actor-creation-time collider initialization (1 and 2) is very convenient, because most of the time you don't
need to change colliders at runtime. The challenge is that with mesh management, the mesh may not yet be loaded
when the actor is created, or the mesh may be assigned well after actor creation. To match the convenience of the
old mesh actor creation methods, I propose two changes.

First, the creation of a new collider type: `auto`. When a mesh is loaded, we will register that mesh's preferred
collider type based on the creation method, so primitives will get basic colliders (box, sphere, etc.) and glTF
meshes will get either a bounding box or a mesh collider depending on `AssetContainer.loadGltf`'s `colliderType`
argument (which matches the `CreateFromGltf` options). Then when a mesh is assigned to an actor with an `auto`
collider type, a new collider is created on the actor based on the registered collider description for that mesh.

Second, allow collider descriptions to be specified explicitly on initialization in the actor patch, instead of
being a separate function argument like in `CreateFromGltf` or `CreatePrimitive`. This approach was rejected
initially to prevent the user from specifying a mesh collider, but that could be done in other ways without
complicating the API. See [Other Considerations](#consolidating-the-collider-apis-into-actor-patch).

For example, if I wanted to create a box button, I might do something like this:

```ts
const context: MRE.Context;
const assets: MRE.AssetContainer;

// With a mesh asset and auto collider:
const actor = MRE.Actor.CreateEmpty(context, {
	actor: {
		name: 'button',
		appearance: {
			meshId: assets.createBoxMesh('button', 0.25, 0.25, 0.1).id
		},
		// Note: This is proposed syntax. Today you'd have to call setCollider after creation.
		// I.e. actor.setCollider('auto')
		collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry }
	}
});

// This would be equivalent to the following without `auto`:
actor = MRE.Actor.CreateEmpty(context, {
	actor: {
		name: 'button',
		appearance: {
			meshId: assets.createBoxMesh('button', 0.25, 0.25, 0.1).id
		}
	}
});
actor.setCollider('box', false, { x: 0, y: 0, z: 0 }, { x: 0.25, y: 0.25, z: 0.1 });

// Or this without mesh assets:
actor = MRE.Actor.CreatePrimitive(context, {
	definition: {
		shape: 'box',
		dimensions: { x: 0.25, y: 0.25, z: 0.1 }
	},
	addCollider: true,
	actor: { name: 'button' }
});
```

## Other Considerations

### Consolidating the collider APIs into actor patch

As previously noted, `CreatePrimitive` has one way to specify a collider, `CreateFromGltf` has another,
and `setCollider` has yet another. This setup was done specifically to make it difficult to change actor
colliders after actor creation. However, based on my research and with the exception of mesh colliders,
creating a collider at patch time is no worse performance-wise than creating one at creation time. As such,
the collider APIs should be consolidated to follow the same semantics as any other actor property.

So instead of the `addCollider` flag:

```ts
MRE.Actor.CreatePrimitive(context, {
	definition: {
		shape: 'box',
		dimensions: { x: 0.25, y: 0.25, z: 0.1 }
	},
	addCollider: true,
	actor: { name: 'button' }
});
```

The user would describe the desired collider in the patch:

```ts
MRE.Actor.CreateEmpty(context, {
	actor: {
		name: 'button',
		appearance: {
			meshId: assets.createBoxMesh('button', 0.25, 0.25, 0.1).id
		},
		collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry }
	}
});
```

This could also allow collider shape modification on the fly:

```ts
actor.collider.geometry = {
	shape: 'sphere',
	radius: 0.5
} as MRE.SphereColliderGeometry;
```

I would also recommend removing `mesh` as a shape type, so it can only be specified implicitly
via `auto`. Or else rename `mesh` to `unmanaged` so it's clear that it can't be used. Alternatively,
we could go in the other direction and allow mesh colliders to be created at any time, and let
the developer determine if it's appropriate to use.

### Removing CreatePrimitive and CreateFromGltf

Now that meshes can be created and assigned to actors after actor creation, these two functions
are providing the same functionality (with reduced performance efficiency) as `Actor.CreateEmpty`
with `AssetContainer.createPrimitiveMesh`, and `Actor.CreateFromPrefab` with `AssetContainer.loadGltf`.
I propose that these functions be removed altogether, and some light syntax sugaring added to make
their replacements more friendly.

```ts
// So this:
MRE.Actor.CreatePrimitive(context, {
	definition: {
		shape: 'sphere',
		radius: 0.5
	},
	addCollider: true,
	actor: {
		name: 'ball'
	}
});

// Would become this:
MRE.Actor.CreateEmpty(context, {
	actor: {
		name: 'ball',
		appearance: {
			meshId: assets.createSphereMesh('ball', 0.5).id
		},
		collider: { geometry: { shape: 'auto' } as MRE.AutoColliderGeometry }
	}
});

// And this:
MRE.Actor.CreateFromGltf(context, {
	resourceUrl: url,
	colliderType: 'mesh',
	actor: {
		name: 'gltf'
	}
});

// Would become this:
MRE.Actor.CreateFromPrefab(context, {
	// new sugar: prefabId could take a promise that will resolve to an array of assets. Create and
	// return the new local actor immediately, but postpone the create-from-prefab network message
	// until the prefab promise resolves.
	prefabId: assets.loadGltf(url, 'mesh'),
	actor: {
		name: 'gltf'
	}
});
```
