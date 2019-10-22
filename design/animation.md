Animations
===========

Our current animation system is under-featured, unstable, and based on tech (Unity Animation components) that is too
rigid for our purposes. We need an animation system that can support the following:

1. Native animations - Animations added to actors from glTF or native Unity sources
2. Interpolation - Vary numeric fields of actors/assets from current values to specified values
	over a duration, with easing
3. Keyframes - Vary numeric fields through a sequence of values on a timeline
4. Step-wise - Setting non-numeric (`boolean`, `string`, etc.) fields on a timeline
5. Moving targets - Setting/interpolating to/from another actor's dynamic values
6. Chaining - Begin an animation immediately after another finishes, or on some other event (behavior tie-in?)
7. Multiple targets - Animate multiple actor/asset properties in lock-step

To address this need, I propose the following API:

API Design
-----------

```ts
type Animatible = Actor | Material;

/** Represents all types of animations */
interface AnimationLike {
	/** Unique identifier of animation */
	name: string;
	/** The length of the animation in seconds */
	duration: number;
	/** How far into play the animation currently is */
	time: number;
	/** A multiplier applied to keyframe timing. Defaults to 1. */
	speed: number;
	/** What to do when the animation completes. In last case, play another animation */
	wrapMode: 'once' | 'yoyo' | 'loop' | string;
	/** A list of actors/materials that this animation affects */
	targets: Animatible[];

	play(): void;
	pause(): void;
	stop(): void;
}

class Animation implements AnimationLike {
	// inherited fields here

	constructor(tracks: Track[]) { }
}

class Track {
	target: Guid;
	keyframes: number[];
	values: Keyframe[];

	addKeyframe(time: number, value: Keyframe) { }
}

type Keyframe = {
	time: number;
	value: Partial<ActorLike> | Partial<MaterialLike> | Guid;
	easing: Vector4;
};
```
