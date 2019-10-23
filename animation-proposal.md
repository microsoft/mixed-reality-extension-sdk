# Animation system - proposed changes


## Rationale

Our current animation system has big shortcomings, and over time it's become clear that the design was off the mark to begin with. Compounding this was taking a dependency on Unity's animation system, which imposed limitations that block us from developing a solution that does what we want.

Some lowlights:
- Unity's animation system cannot animate properties like material color, rigid body mass, light intensity, etc.
- Unity's animation system cannot operate in app-relative coordinates.
- Our API for programmatic generation of keyframed animations is both unwieldly and of limited use.
- Our existing `animateTo` implementation leverages the current animation system, which is bad.




## Proposal

It isn't feasable to implement our own animation system, but I also believe we don't need to. I instead recommend we support playing native animations, and we implement a simple but powerful interpolation API that supports interpolating any mutable property on `Actor` or `Asset`.

In short:
- Add support for playing animations defined on assets (loaded from glTF files, Unity asset bundles, etc.).
- Add generalized support for interpolating any mutable property of an `Actor` or `Asset`.
- Remove support for programmatic animaton generation.
- Remove the existing `animateTo` call in favor of the new interpolation solution.



## API

### Animations

#### Move animation API to new class called `Animation`

When a model is loaded from a resource, its animations will be included in the `object-spawned` reply, and be available on `Actor` as an array of `AnimationLike` types. `AnimationLike` will define the API for starting, stopping, seeking, etc. animations.

```ts
export interface AnimationLike {
	/**
	 * getter that returns the name of the animation.
	 */
	public name: string;

	/**
	 * Starts playing the animation from the beginning.
	 * @returns A Promise that resolves when the animation completes or is stopped.
	 */
	public start(): Promise<void>;

	/**
	 * Stops the animation on the actor and resolves promises returned from `completed()`.
	 */
	public stop();

	/**
	 * Pauses the animation (sets animation speed to zero).
	 */
	public pause();

	/**
	 * Resumes the animation (sets animation speed to 1).
	 */
	public resume();

	/**
	 * Sets the animation time (units are in seconds).
	 */
	public setTime(time: number);

	/**
	 * Sets the playback speed.
	 */
	public setSpeed(speed: number);

	/**
	 * (Advanced) Sets the time, speed, and enabled state of an animation.
	 */
	public setState(state: SetAnimationStateOptions);

	/**
	 * @returns A Promise that resolves when the animation completes or is stopped.
	 */
	public completed(): Promise<void>;
}
```

Then, on `Actor`:

```ts
/**
 * getter that returns the array of animations defined on this actor.
 */
public get animations(): AnimationLike[];

/**
 * Get an animation by name.
 */
public animation(animationName: string): AnimationLike;
```

#### Examples

```ts
// Play the 'jump' animation, then do something when it's done.
actor.animation("jump").start().then(() => console.log("done jumping"));

// Play the 'victory' animation, and wait for it to complete.
await actor.animation("victory").start();
```


### Interpolations

#### Add `Context.interpolate` method

Add an `interpolate` method to the `Context` class. Calling `interpolate` starts a lerp operation on the host, and returns a Promise that will resolve after `seconds` time has elapsed or the interpolation is otherwise canceled.

```ts
/**
 * Interpolates the field indicated by `selector` to `value` over `interval` seconds along `options.curve`.
 * @param selector The selector of the field to interpolate. Get this value by calling actor.selector(fieldpath) or asset.selector(fieldpath).
 * @param from (Optional) The starting value of the interpolation. Can be a selector or a concrete value. Pass `null` to start at the current value of the `selector` field.
 * @param to The ending value of the interpolation. Can be a selector or a concrete value.
 * @param interval The duration of the interolation in seconds. Pass in `null` to cancel an existing matching interpolation.
 * @param options Optional parameters to further customize the interpolation.
 * @param options.curve Specifies the interpolation's speed curve. This can be one of the predefined curve names, or a custom curve. Default: "linear".
 * @param options.basis How to interpret `value`. If `options.basis` is "absolute" this function will interpolate to `value`. If `options.basis` is "relative", this function interpolates by `value` amount. Default: "absolute".
 * @param options.iterationCount How many times to run the interpolation. Can be a number, or "infinite". Default: 1.
 * @param options.direction The direction the interpolation should be played.
 */
public interpolate(
	selector: Selector,
	from: InterpolationValueType | null,
	to: InterpolationValueType,
	interval: number | null,
	options?: {
		curve: InterpolationCurve = "linear",
		basis: InterpolationBasis = "absolute",
		iterationCount: InterpolationIterationCount = 1,
		direction: InterpolationDirection = "forward"
	}): Promise<void>;
```


Several new types were introduced in the definition of `interpolate` above. Expanding them:

```ts
/**
 * A union of the different types that can be passed to the
 * `interpolate` method's `value` parameter.
 */
export type InterpolationValueType
	= Selector
	| Quaternion
	| Partial<Vector3>
	| Partial<Vector2>
	| Partial<Color>
	| number
	| boolean
	| GroupMask
	;

/**
 * Describes an interpolation curve, predefined or custom.
 * Predefined/common curves can be specified by name, or custom curve parameters can be given directly.
 */
export type InterpolationCurve
	/**
	 * Moves from beginning to end at a constant rate.
	 * Equivalent to: [0.0, 0.0, 1.0 ,1.0]
	 */
	= "linear"

	/**
	 * The animation starts slowly, accelerates sharply, and then slows
	 * gradually towards the end. It is similar to `ease-in-out`, though
	 * it accelerates more sharply at the beginning.
	 * Equivalent to: [0.25, 0.1, 0.25, 1.0]
	 */
	| "ease"

	/**
	 * The animation starts slowly, and then progressively speeds up until
	 * the end, at which point it stops abruptly.
	 * Equivalent to: [0.42, 0.0, 1.0, 1.0]
	 */
	| "ease-in"

	/**
	 * The animation starts slowly, speeds up, and then slows down towards
	 * the end. At the beginning, it behaves like ease-in; at the end, it
	 * behaves like ease-out.
	 * Equivalent to: [0.42, 0.0, 0.58, 1.0]
	 */
	| "ease-in-out"

	/**
	 * The animation starts abruptly, and then progressively slows down
	 * towards the end.
	 * Equivalent to: [0.0, 0.0, 0.58, 1.0]
	 */
	| "ease-out"

	/**
	 * Define a custom curve by providing P1 and P2 of a cubic bezier
	 * curve. To be valid, each point's abscissa must be in [0, 1].
	 * The ordinate may be outside this range; if so then you will
	 * get a bounce effect.
	 */
	| number[];

/**
 * Describes how the `value` parameter to `interpolate` should be interpreted.
 */
export type InterpolationBasis
	/** The value is an absolute value. The function operates as "Interpolate to this value". */
	= "absolute"

	/** The value is relative to the starting value. The function operates as "Interpolate by this much". */
	| "relative"
	;

/**
 * Describes how many times the interpolation should repeat.
 */
export type InterpolationIterationCount
	/** Run the interpolation this many times. */
	= number

	/** Run the interpolation forever (until canceled). */
	| "infinite"
	;

/**
 * Specifies the direction the interpolation should be played.
 */
export type InterpolationDirection
	/** The interpolation is played forward. */
	= "forward"
	/** The interpolation is played in reverse. */
	| "reverse"
	/** The interpolation is played forward, then backward, alternating. */
	| "alternate"
	/** Same as "alternate", but starts out playing backward. */
	| "alternate-reverse"
	;
```

##### Examples

```ts
// Interpolate a vector (lerp).
this.context.interpolate(
	actor.selector('transform.app.position'),
	null, // use current value as starting value
	position,
	0.2);

// Interpolate a quaternion (slerp).
this.context.interpolate(
	actor.selector('transform.app.rotation'),
	null, // use current value as starting value
	rotation,
	0.2,
	{ curve: "ease" });

// Interpolate a number.
this.context.interpolate(
	actor.selector('light.intensity'),
	null, // use current value as starting value
	1,
	0.2,
	{ curve: "ease-in" });

// Interpolate a color.
this.context.interpolate(
	material.selector('color'),
	null, // use current value as starting value
	color,
	0.2,
	{ curve: "ease-out" });

// Interpolate a value on a custom curve (a "bounce", in this case).
this.context.interpolate(
	material.selector('color'),
	null, // use current value as starting value
	color,
	0.2,
	{ curve: [0.1, -0.6, 0.2, 0] });

// Interpolate to another actor's position by reference. The host reads the
// target actor's position locally via the target selector, enabling smooth
// continuous interpolation to a moving target, and alleviating the need to
// subscribe to the target actor's transform.
this.context.interpolate(
	actor.selector('transform.app.position'),
	null, // use current value as starting value
	target.selector('transform.app.position'),
	0.2, {
		iterationCount: "infinite"
	});

// Cancel an interpolation. This applies to all types of interpolations, but
// is particularly useful for stopping continuous interpolations.
this.context.interpolate(
	actor.selector('transform.app.position'),
	null,
	target.selector('transform.app.position'),
	null);
)
```

#### Add `Actor.selector` and `Asset.selector` accessors

Add a `selector` method to classes `Actor` and `Asset`. `selector`'s argument is a string representation of the path to the field to animate, suitable for the host to look up the value client-side. The selector method should validate the field path and that the field is animatable.

```ts
/**
 * Returns an absolute reference to the given field, including object type and unique id.
 * @param path The relative path to the field, e.g.: "transform.local.position".
 * @returns An absolute path to the field, suitable for use by the host to look
 * up the value client-side. Example:
 * 	const selector = pawn.selector('transform.local.position');
 *	console.log(selector); // prints '//Actor/<actor-id>/transform/local/position'
 */
public selector(path: string): Selector;
```



## Synchronization support

### Animations

Implementation note: When the client loads a model (glTF, Unity asset bundle, etc.), it must include the set of animations and their lengths in the `object-spawned` reply message. This is so that the sync layer will always know the length of animations and doesn't need to rely on messages from clients to know when an animation completes.


The sync layer will cache active `set-animation-state` commands, and delete them when the animation completes or is canceled. When a new client joins, all cached `set-animation-state` commands are sent to them with the appropriate time offsets so that the animations are synchronized.


### Interpolations

The sync layer will cache active `interpolate` commands along with the time they were started, and delete them at the right time (when cancelled or completed). When a new client joins, all cached `interpolate` commands are sent to them.



## Concerns

How the actor patching system works will not play well with interpolations in some cases. For example, take the following code:

```ts
actor.transform.local.position.x = 1;
this.context.interpolate(
	actor.selector('transform.local.position.x'),
	null, // use current value as starting value
	5,
	0.2);
```


In this scenario, the `interpolate` command will be sent before the patching system detects the change to `position.x` and sends an `actor-update` with the new value. This means that client-side, the interpolation operation's initial value for position.x will be incorrect.


To correct this, we need to batch all outgoing messages and send them after actor patch detection runs. And we will need to make improvements to how actor patch detection is triggered.



## Selector

TBD