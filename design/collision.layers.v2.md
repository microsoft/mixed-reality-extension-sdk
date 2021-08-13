## One Line Concept:
Change collision layer system to be more intuitive and safely support group masks and exclusive actors, UI, and triggers

## Problem Description: 
The collision system is used in a number of different cases, such as: Rigid Body Collision with Kinematic/Static objects or with other rigid bodies, Player Controller collision, Teleport ray collisions, UI ray collisions, proximity grab, Trigger Zones (for rigid bodies and for players.)

The current collision layer implementation loosely wraps the Unity collision layers, and allowing 4 different layers (Default, NavMesh, Hologram, UI) to be assigned freely to all colliders regardless of usage.

The design had to minimize number of collision layers (as that is a shared resource in Unity, and there are only 32 layers shared between all collision and all rendering), and that affected the design.

The current implementation is problematic, because
1. it's not intuitive what the different types do, or when they should be used.
2. if using group masked/exclusive actors in certain cases, they can cause issues with rigid body simulation not being (largely) globally consistent across all connected clients

I propose a new collision layer system that follow a number of requirements
1. certain things (collisions between rigid body actors) depend on the authoritative peer client, and therefore exclusive actors and group masking cannot be allowed.
2. anything that can happen on a specific client must be independent of the authoritative peer, to support exclusive actor and group masks - for example behaviors, personal UI, player-specific collisions and triggers
3. each layer is configured for specific use cases and named accordingly.

The system changes MRE collision layers to be more than just the equivalent of a Unity Layer, by adding additional restrictions and associated properties to each. Each layer has different requirements for
1. Whether they can be exclusive/groupmasked, or they have to be global
2. Which other layers it collides against
3. Whether the collider must be triggers or non-triggers
4. What it is generally used for

I have come up with a list of 6 distinct collision layers to cover the common use cases. 

 MRE Collision Layer Name|Used for|Can be exclusive/groupmasked|In Altspace uses Unity Layer|In Altspace Collides against Layers|IsTrigger in Unity
 :--|:-:|:-:|:-:|:-:|--:
 Physical|Rigid body, Player Collision, Blocks Cursor|no*|Default|Default, NavMesh, CharacterController, Interactables|no
 PhysicalTeleportable|Same as Physical, but is also valid teleport destination|no*|NavMesh|Default, NavMesh, CharacterController, Interactables|no
 CharacterBlocking|blocks charactercontroller, but not rigid bodies or cursor|yes|IgnoreRaycast|CharacterController|no
 UI|ButtonBehavior,ToolBehavior, 2D UI|yes|MREUI(new)|None|yes
 PersonalTrigger|Trigger Volumes for charactercontrollers and exclusive (not group masked) rigid bodies|yes|MREPersonalTrigger(new)|Default,NavMesh,CharacterController|yes
 GlobalTrigger|Trigger Volumes for global (not group masked/exclusive) rigid bodies|no|MREGlobalTrigger(new)|Default,NavMesh,CharacterController|yes
 
*Note about physical/physicalteleportable: Rigid bodies (but not static or kinematic objects with colliders) are allowed to be exclusive actors (but not groupmasked), because by setting mass super low, the global actors always push exclusive actors. Therefore the exclusive rigid bodies don't mess with the global consistency of the physics simulation. So you can stack exclusive actors on global actors, but not vice versa.

Note that PersonalTrigger and PhysicalTrigger code will have to manually filter out actors that is in the right unity layer, but don't match the requirements (personaltrigger=must be client's own character controller, or exclusive actors, but exclude other characters and groupmasked/global actors, physicaltrigger must exclude groupmasked/exclusive actors).

## Notes

Altspace details: While I know Altspace is layer constrained, I think I have come up with 3 layers.

We would remove the “IsTrigger” flag from the MRE api surface – it’s implicit from MRE collision layer now.

Any category of messages (collisionOn/collisionOff/behaviors) that are allowed to be non-global should be sent from each client, not by authoritative peer.

Required Error checking: 
1. We should error on physical/physicalandteleportable/physicaltrigger collision layers assigned to exclusive/grouped actors that are in the wrong groups. We should also error if user changes collision layer after actor creation on physical/physicalandteleportable/physicaltrigger collision layers assigned to exclusive/grouped actors.
2. We should warn when button (possibly certain tool) behavior is using layer other than UI

## Implementation order
1. add new layers to sdk and runtime, and configure testbeds and altspace implementations, including the collision masks
2. remove istrigger flag from MRE API and protocol, and drive it from Unity Runtime
3. enforce errors on actor creation
4. enforce errors on collision layer change after actor creation
5. check for warning on button behavior assignment
6. Make triggers filter out the events that don't match the requirements

