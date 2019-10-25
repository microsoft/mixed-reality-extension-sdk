Animations
===========

Our current animation system is under-featured, unstable, and based on tech (Unity Animation components) that is too
rigid for our purposes. We need an animation system that can support the following:

1. Native animations - Animations added to actors from glTF or native Unity sources should support the basic API: play, pause, seek.
2. Keyframes - Vary actor/asset fields through a sequence of values on a timeline.
	1. Interpolation - Make simple single-target two-frame animations easy to generate.
	2. Moving targets - Setting/interpolating to/from another actor's dynamic values. Useful for look-at and fly-to type animations.
3. Easing - Support different interpolation curves between keyframes.
	1. No easing - Setting fields that cannot be interpolated should also be supported (string, boolean, etc.).
4. Chaining - Begin an animation immediately after another finishes, or on some other event (behavior tie-in?)
5. Multiple targets - Animate multiple actors/assets, and multiple properties, in lock-step (equivalent to Unity's animation curves)

To address this need, I propose the following API:

Use Cases
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
const walkAnim: MRE.Animation = assets.animations.find(a => a.name === 'walk');
walkAnim.play();
// or
actor.animations('walk').play();
```

Create an animation from scratch, that arcs an actor toward some other stationary actor:

```ts
let arrow: MRE.Actor;
let bullseye: MRE.Actor;

// Animations are assets
const arcAnim: MRE.Animation = assets.createAnimation('arc', {
	tracks: [
		// animate position.x straight there
		{
			// Easy-to-understand autocompleting syntax for target paths
			target: MRE.Animation.Actor(arrow).transform.app.position.x,
			// t=0 keyframe is omitted, so start from actor's current value
			keyframes: [{
				time: 5,
				value: bullseye.transform.app.position.x,
				easing: MRE.Animation.Easing.Linear
			}]
		},
		// animate position.z straight there
		{
			target: MRE.Animation.Actor(arrow).transform.app.position.z,
			keyframes: [{
				time: 5,
				value: bullseye.transform.app.position.z,
				easing: MRE.Animation.Easing.Linear
			}]
		},
		// arc position.y via a point above the midpoint between start and bullseye
		// assume bullseye is on a level with the start point
		{
			target: MRE.Animation.Actor(arrow).transform.app.position.y,
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
			target: MRE.Animation.Actor(arrow).transform.app.rotation,
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
arcAnim.play();
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


API Design
-----------

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
```
