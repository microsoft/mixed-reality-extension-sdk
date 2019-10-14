Collision Layers
=================

Collision layers are hard, because every engine does it differently. I will attempt to document how it works in each major physics engine here:

* **Unity (static one:many)** - Each object in the scene is assigned exactly one layer (not inherited). The matrix of which layers collide with which other layers is fixed at compile time (configurable from Project Settings). In addition to being used for collisions, these layers are also used by cameras to limit what is rendered, by the lighting system to determine which lights shine on an object, and which objects are hit by a raycast. The global maximum layer count is 31.

* **Unreal 4 (dynamic one:many)** - Each object in the scene is assigned exactly one "object type" and a list of how that object responds to every other object type. All these can be set at runtime. Raycasts are also assigned a type from the list, so the interaction scheme is the same. The global maximum type count is 32.

* **Bullet (dynamic many:many)** - Each object is assigned a "collision groups" bitfield32 and a "collision mask" bitfield32. Two objects only collide if one of object A's groups is in object B's mask, and vice versa. Raycasts work the same way, with group and mask fields.

With this in mind, I propose the following architecture:

API Design
-----------

Add a field to the `Collider` and `ColliderLike` types: `layer: CollisionLayer`.

Layers
-------

I believe a fixed collision layer strategy can cover the most common use cases. In this proposal, there are four collision layers:

```ts
/**
 * Controls what the assigned actors will collide with.
 */
export enum CollisionLayer {
	/**
	 * Good for most actors. These will collide with all "physical" things: other default actors,
	 * navigation actors, and the non-MRE environment. It also blocks the UI cursor and receives press/grab events.
	 */
	Default = 'default',
	/**
	 * For actors considered part of the environment. Can move/teleport onto these colliders,
	 * but cannot click or grab them. For example, the floor, an invisible wall, or an elevator platform.
	 */
	Navigation = 'navigation',
	/**
	 * For "non-physical" actors. Only interact with the cursor (with press/grab events) and other holograms.
	 * For example, if you wanted a group of actors to behave as a separate physics simulation
	 * from the main scene.
	 */
	Hologram = 'hologram',
	/**
	 * Actors in this layer do not collide with anything but the UI cursor.
	 */
	UI = 'ui'
}
```

| Self \ Other  | Default | Navigation | Hologram | UI | Cursor | Environment | Player |
|---------------|---------|------------|----------|----|--------|-------------|--------|
| Default       | X       | X          |          |    | X      | X           |        |
| Navigation    | X       | X          |          |    | *      | X           | X      |
| Hologram      |         |            | X        |    | X      |             |        |
| UI            |         |            |          |    | X      |             |        |

\* Blocks cursor, but does not get click/grab events.

Sync Considerations
---------------------

The new field is on the actor, and doesn't require any special considerations.

Unity Considerations
---------------------

Candidate Altspace layers:

* `default` => "Default"
* `navigation` => "NavMesh"
* `hologram` => "HolographicElements"
* `ui` => "UI"
