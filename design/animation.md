Animations
===========

Our current animation system is under-featured, unstable, and based on tech (Unity Animation components) that is too
rigid for our purposes. We need an animation system that can support the following:

1. Native animations - Animations added to actors from glTF or native Unity sources should support the basic API: play,
	pause, seek.
2. Keyframes - Vary actor/asset fields through a sequence of values on a timeline.
	1. Interpolation - Make simple single-target two-frame animations easy to generate.
	2. Moving targets - Setting/interpolating to/from another actor's dynamic values. Useful for look-at and
		fly-to type animations.
3. Easing - Support different interpolation curves between keyframes.
	1. No easing - Setting fields that cannot be interpolated should also be supported (string, boolean, etc.).
4. Chaining - Begin an animation immediately after another finishes, or on some other event (behavior tie-in?)
5. Multiple targets - Animate multiple actors/assets, and multiple properties, in lock-step (equivalent to Unity's
	animation curves)
6. Blending - Allow multiple animations to run on the same target simultaneously, and blend the computed destinations
	into one, proportional to a weight property.

To address this need, I propose the following API:

API Design
-----------

Animations are assets. They are created explicitly by a function on asset containers (
`AssetContainer.createAnimation`). Native animations from library or glTF actors do not create these assets, instead
creating animation instances only (see [Instances](#instances)).

When created directly, animations are created as an array of "tracks", each composed of:
1. A generic path to a field that can be animated (see [Paths](#paths)).
2. An array of keyframes, each composed of:
	1. A time value.
	2. A valid value for the targeted path.
	3. An optional bezier easing function.

```ts
type Animatible = Actor | Material;

class Animation {
	id: Readonly<string>;
	duration: Readonly<number>;
	targetCount: Readonly<number>;
}

class AssetContainer {
	public createAnimation(name: string, options: { targetCount?: number, tracks: Track<AnimationProp>[] }): Animation;
}

type AnimationProp = Vector2 | Vector3 | Quaternion | Color3 | Color4 | number | string | boolean;

type Track<T extends AnimationProp> = {
	target: TargetPath<T>;
	keyframes: Keyframe<T>[];
}

type Keyframe<T extends AnimationProp> = {
	time: number;
	value: T;
	easing?: EasingFunction;
}

type EasingFunction = [number, number, number, number];
```

### Paths

Paths are references to properties on an object that can be animated (Actor, Material, etc.). Paths do not reference
properties on a *particular* object, but instead reference a generic object of a given type by index. When bound,
the animation will be given the list of objects which it will be modifying, and these path indices refer to that
argument. Over the wire these are represented as strings, but are easily generated in the API with helper functions.

```ts
class TargetPath<T> {
	private parent: TargetPath<any>;
	constructor(name: string, children: Map<string, TargetPath<any>>) {
		for (const [k,v] of children) {
			this[k] = v;
			v.parent = this;
		}
	}
	public toJSON() {
		// convert tree into string
	}
}
function AnimateActor(index: number) {
	return new TargetPath<never>(`actor.${index}`, {
		transform: new TargetPath<never>("transform", {
			local: new TargetPath<never>("local", {
				position: new TargetPath<Vector3>("position", {
					x: new TargetPath<number>("x"),
					y: new TargetPath<number>("y"),
					z: new TargetPath<number>("z")
				})
			})
		})
	});
}

const track = {
	target: AnimateActor(0).transform.local.position
	// ...
} as Track<Vector3>;
```

### Instances

Animation instances are animations that have been bound to a particular set of actors and materials. These instances
can be created by explicitly binding an animation (`Animation.bind(...objects)`), or may be returned during actor
creation from `Actor.CreateFromPrefab`/`Gltf`/`Library`. Unlike the asset, instances can be played, paused, set speed,
etc. Animation instances can either be stored directly, or obtained from any of the actors/materials that participate
in the animation. Instances participate in the patching system, so changing properties on the animation instance
are pushed down to clients automatically.

An animation instance can be set to start another animation on the instant that it finishes, by setting an instance's
`continueWith` property. Because it's set in advance, there is zero downtime between one ending and another starting,
and does not require a round trip.

```ts
class Animation {
	bind(...args: Animatible[]): AnimationInstance;
}

class AnimationInstance {
	/** Generated unique ID */
	id: Readonly<string>;

	/** Playback speed multiplier */
	speed: number;
	/** What happens when the animation hits the last frame */
	wrapMode: WrapMode;
	/** When multiple animations play together, this is the relative strength of this instance */
	weight: number;
	/** The current playback time, based on start time and speed */
	time: number;
	/** The list of actors/materials that participate in this instance */
	targets: Readonly<Animatible[]>;
	/** The playing animation */
	animation: Readonly<Animation>;
	/** Start these animation instances after this one completes */
	continueWith: AnimationInstance[];

	/** Current play state */
	isPlaying: Readonly<boolean>;

	play(): void;
	pause(): void;

	/** Only fired if wrapMode is Once */
	finished(): Promise<void>;
	/** Sets the `continueWith` property, and returns the next anim instance */
	continueWith(otherAnim: AnimationInstace): AnimationInstance;
}

enum WrapMode {
	Once = 'once',
	Loop = 'loop',
	Yoyo = 'yoyo'
}

const ticktock: MRE.Animation = assets.createAnimation(...);
const animInstance: MRE.AnimationInstance = ticktock.bind(firstBall, lastBall);
animInstance.speed = 1.5;
animInstance.play();

// this prefab has an animation instance pre-allocated
const cradle = MRE.Actor.CreateFromPrefab(context, { prefab: assets.prefabs[0] });
await cradle.created();
cradle.animations('rock').play();
```

### Convenience function

For many purposes, creating and managing an animation is overkill. This is why objects that can be animated have a
convenient fire-and-forget function: `animateTo`. This function takes a "destination" ActorLike or MaterialLike and
a duration as input, generates a simple one-frame animation from all the fields given in the -Like, binds it to the
object, and plays it.

```ts
class Animation {
	public static AnimateTo(target: Animatible, options: {
		duration: number;
		destination: ActorLike | MaterialLike;
		easing?: EasingFunction;
	}): AnimationInstance { }
}
const anim: MRE.AnimationInstance = MRE.Animation.AnimateTo(material, {
	duration: 1,
	easing: MRE.Animation.Easing.Linear,
	// each nested non-undefined property is converted to a track in a one-frame animation
	target: { color: { a: 0 } } as MRE.MaterialLike
});
```

Network Messaging
------------------

1. Modify `create-asset` for creating animations.
2. Modify `asset-loaded` for getting animation creation results back.
3. Modify `object-spawned` to include animation instances in prefabs/library actors.
4. New message `create-animinstance`, sent when an animation is bound to actors/materials.
5. New message `animinstance-update`, sent when unpredictable animation instance properties are patched, i.e.
	properties other than `time`. This includes `isPlaying`, which is set by `play()` and `pause()`.

`AnimationInstance.finished` might not require a round trip if a server-side timer can be used. Perhaps this
server-side timer could also be used for "animation events"?

Synchronization Concerns
--------------------------

The session needs to track animation instances (`create-animinstance`) and update them when patched
(`animinstance-update`).

The session needs to know what time the animation was started, so it can give late joiners the correct
`AnimationInstance.time` value.

Unity Concerns
---------------

This entire animation system (except native animations) needs to be implemented in Unity. Since in Unity only actors
can have MonoBehaviours, animations need to be driven by a singleton behavior, AnimationManager, instead of a
behavior on each target. The manager would process all animation instance messages, look up all targets, and compute
the correct value for each target each frame.

Examples
----------

```ts
const assets = new MRE.AssetContainer(this.context);
await assets.loadGltf(`${this.baseUrl}/myfile.gltf`);
const actor = MRE.Actor.CreateFromPrefab(this.context, {
	prefab: assets.prefabs[0],
	actor: { name: 'mymodel' }
});
```

Loading and playing a native animation from glTF:

```ts
actor.animations('walk').play();
```

Create an animation from scratch, that arcs an actor toward some other stationary actor:

```ts
let arrow: MRE.Actor;
let bullseye: MRE.Actor;

// Animations are assets
const arcAnim: MRE.Animation = assets.createAnimation('arc', {
	targetCount: 1,
	tracks: [
		// animate position.x straight there
		{
			// Easy-to-understand autocompleting syntax for target paths
			target: MRE.Animation.Actor(0).transform.app.position.x,
			// t=0 keyframe is omitted, so start from actor's current value
			keyframes: [{
				time: 5,
				value: bullseye.transform.app.position.x,
				easing: MRE.Animation.Easing.Linear
			}]
		},
		// animate position.z straight there
		{
			target: MRE.Animation.Actor(0).transform.app.position.z,
			keyframes: [{
				time: 5,
				value: bullseye.transform.app.position.z,
				easing: MRE.Animation.Easing.Linear
			}]
		},
		// arc position.y via a point above the midpoint between start and bullseye
		// assume bullseye is on a level with the start point
		{
			target: MRE.Animation.Actor(0).transform.app.position.y,
			keyframes: [{
				time: 2.5,
				value: arrow.transform.app.position.y + 0.57 * MRE.Vector3.Distance(
					arrow.transform.app.position, bullseye.transform.app.position
				),
				// slowly approach apex
				easing: MRE.Animation.Easing.QuadraticOut
			}, {
				time: 5,
				value: bullseye.transform.app.position.y,
				// slowly descend from apex
				easing: MRE.Animation.Easing.QuadraticIn
			}]
		},
		// rotate arrow to face direction of travel
		{
			target: MRE.Animation.Actor(0).transform.app.rotation,
			keyframes: [{
				time: 0,
				value: MRE.Quaternion.FromEulerAngles(45 * MRE.DegreesToRadians, 0, 0);
			}, {
				time: 5,
				value: MRE.Quaternion.FromEulerAngles(-45 * MRE.DegreesToRadians, 0, 0),
				easing: MRE.Animation.Easing.Linear
			}]
		}
	]
});
arcAnim.play(arrow);
```

Fade out a material over one second:

```ts
const anim: MRE.Animation = material.animateTo({
	duration: 1,
	easing: MRE.Animation.Easing.Linear,
	// each nested non-undefined property is converted to a track in a two-frame animation
	target: { color: { a: 0 } } as MRE.MaterialLike
});
```


Scratch
--------

```ts
type Animatible = Actor | Material;

/** Represents all types of animations */
interface AnimationLike {
	/** The length of the animation in seconds */
	duration: Readonly<number>;
	/** How far into play the animation currently is */
	time: number;
	/** A multiplier applied to keyframe timing. Defaults to 1. */
	speed: number;
	/** What to do when the animation completes. In last case, play another animation */
	wrapMode: 'once' | 'yoyo' | 'loop' | string;
	/** A list of actors/materials that this animation affects */
	targets: Readonly<Animatible[]>;
	/** Whether or not this animation is currently running */
	playing: Readonly<boolean>;

	play(): void;
	pause(): void;
	stop(): void;
}

class Animation extends Asset implements AnimationLike {
	/* inherited defs here */

	constructor(tracks: Track[]) { }
}

type Track = {
	/** An identifier for a particular field in a particular Animatible. */
	target: string;
	keyframes: Keyframe[];
};

type Keyframe = {
	time: number;
	value: any;
	easing: EasingFunction;
};

type EasingFunction = [number, number, number, number];

const Easing = {
	Linear: [0, 0, 1, 1],
	QuadraticIn: [0.55, 0.085, 0.68, 0.53],
	// ...
}

class AnimationInstance {

}
```
