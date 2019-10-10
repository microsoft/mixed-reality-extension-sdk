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
type CollisionLayer
	= 'default'
	| 'ui'
	| 'navigation'
	| 'hologram';
```

* `Default` - Good for most actors. These will collide with all "physical" things: other default actors, navigation actors, and the non-MRE environment. It also blocks the UI cursor and receives press/grab events.
* `UI` - Actors in this layer do not collide with anything but the UI cursor.
* `Navigation` - For actors considered part of the environment. Can move/teleport onto these colliders, but cannot click or grab them.
* `Hologram` - For "non-physical" actors. Only interact with the cursor and other holograms.

| Self \ Other  | Default | UI | Navigation | Hologram | Cursor | Environment | Player |
|---------------|---------|----|------------|----------|--------|-------------|--------|
| Default       | X       |    | X          |          | X      | X           |        |
| UI            |         |    |            |          | X      |             |        |
| Navigation    | X       |    | X          |          |        | X           | X      |
| Hologram      |         |    |            | X        | X      |             |        |


