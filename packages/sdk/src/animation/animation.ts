/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	Actor,
	Animatible,
	AnimatibleName,
	AnimationProp,
	AnimationWrapMode,
	AssetContainer,
	Context,
	EaseCurve,
	Guid,
	Material,
	Track
} from '..';
import {
	ExportedPromise,
	Like,
	Patchable,
	readPath
} from '../internal';
import { AnimationInternal } from './animationInternal';

/** Options for [[Animation.AnimateTo]]. */
export type AnimateToOptions<T extends Animatible> = {
	/** The amount of time in seconds it takes to reach the [[destination]] value. */
	duration: number;
	/** A collection of property values that should be animated, and the desired final values. */
	destination: Partial<Like<T>>;
	/** How the values should approach their destinations. Defaults to [[AnimationEaseCurves.Linear]]. */
	easing?: EaseCurve;
}

/** A serialized animation definition */
export interface AnimationLike {
	/** Generated unique ID of this animation */
	id: Guid;
	/** The non-unique name of this animation */
	name: string;
	/** The server time (in milliseconds since the UNIX epoch) when the animation was started */
	basisTime: number;
	/** The current playback time, based on basis time and speed */
	time: number;
	/** Playback speed multiplier */
	speed: number;
	/** When multiple animations play together, this is the relative strength of this instance */
	weight: number;
	/** What happens when the animation hits the last frame */
	wrapMode: AnimationWrapMode;

	/** The ID of the AnimationData bound to this animation */
	dataId: Readonly<Guid>;
	/** The IDs of the objects targeted by this animation */
	targetIds: Readonly<Guid[]>;

	/** The length in seconds of the animation */
	duration: number;
}

/** A runtime animation */
export class Animation implements AnimationLike, Patchable<AnimationLike> {
	/** @hidden */
	public internal = new AnimationInternal(this);

	private _id: Guid;
	/** @inheritdoc */
	public get id() { return this._id; }

	private _name: string;
	/** @inheritdoc */
	public get name() { return this._name; }
	public set name(val) {
		this._name = val;
		this.animationChanged('name');
	}

	private _basisTime = 0;
	/** @inheritdoc */
	public get basisTime(): number {
		if (this.isPlaying && this.speed !== 0) {
			return this._basisTime;
		} else {
			return Math.max(0, Date.now() - Math.floor(this.time * 1000 / this.speed));
		}
	}
	public set basisTime(val) {
		if (this._basisTime !== val) {
			this._basisTime = Math.max(0, val);
			this._time = (Date.now() - this._basisTime) * this.speed / 1000;
			this.animationChanged('basisTime');
			this.animationChanged('time');
			this.updateTimeout();
		}
	}

	private _time = 0;
	/** @inheritdoc */
	public get time(): number {
		if (!this.isPlaying || this.speed === 0) {
			return this._time;
		} else {
			return (Date.now() - this.basisTime) * this.speed / 1000;
		}
	}
	public set time(val) {
		if (this._time !== val) {
			this._time = val;
			this._basisTime = Math.max(0, Date.now() - Math.floor(this._time * 1000 / this.speed));
			this.animationChanged('time');
			this.animationChanged('basisTime');
			this.updateTimeout();
		}
	}

	/** [[time]], correcting for overruns from looping animations. Is always between 0 and [[duration]]. */
	public get normalizedTime() {
		let time = this.time % this.duration;
		if (time < 0) {
			time += this.duration;
		}
		return time;
	}

	private _speed = 0;
	/** @inheritdoc */
	public get speed() { return this._speed; }
	public set speed(val) {
		const curTime = this.time;
		this._speed = val;
		this.animationChanged('speed');

		// recompute stored times such that there is continuity pre- and post-speed change
		if (this.isPlaying && this._speed !== 0) {
			this._basisTime = Math.max(0, Date.now() - Math.floor(curTime * 1000 / this.speed));
			this.animationChanged('basisTime');
		} else {
			this._time = curTime;
			this.animationChanged('time');
		}

		this.updateTimeout();
	}

	private _weight = 0;
	/** @inheritdoc */
	public get weight() { return this._weight; }
	public set weight(val) {
		// Getter for time converts the internal _basisTime var into the corresponding offset time,
		// so reassigning it writes this converted time back into the internal _time var.
		// This is needed so the paused state is stored correctly.
		if (val === 0) {
			// eslint-disable-next-line no-self-assign
			this.time = this.time;
		}
		this._weight = val;
		this.animationChanged('weight');
		this.updateTimeout();
	}

	private _wrapMode = AnimationWrapMode.Once;
	/** @inheritdoc */
	public get wrapMode() { return this._wrapMode; }
	public set wrapMode(val) {
		this._wrapMode = val;
		this.animationChanged('wrapMode');
		this.updateTimeout();
	}

	private _dataId: Guid;
	/** @inheritdoc */
	public get dataId() { return this._dataId; }
	/** The keyframe data bound to this animation */
	public get data() { return this.context.asset(this._dataId)?.animationData; }

	private _targetIds: Guid[] = [];
	/** @inheritdoc */
	public get targetIds() { return Object.freeze([...this._targetIds]); }

	/** The list of actors targeted by this animation. */
	public get targetActors() { return this.targetIds.map(id => this.context.actor(id)).filter(a => !!a); }
	/** The list of animations targeted by this animation. */
	public get targetAnimations() { return this.targetIds.map(id => this.context.animation(id)).filter(a => !!a); }
	/** The list of materials targeted by this animation. */
	public get targetMaterials() { return this.targetIds.map(id => this.context.asset(id)?.material).filter(a => !!a); }

	private _duration: number;
	/** @inheritdoc */
	public get duration() { return this._duration; }

	/**
	 * Determine if this animation is playing based on the animation's weight. Setting this property calls
	 * [[play]] and [[stop]] internally.
	 */
	public get isPlaying() { return this.weight > 0; }
	public set isPlaying(val) {
		if (val) {
			this.play();
		} else {
			this.stop();
		}
	}

	/** The list of other animations that target this animation, by ID. */
	public get targetingAnimations() {
		return this.context.animations
			.filter(anim => anim.targetIds.includes(this.id))
			.reduce(
				(map, anim) => {
					map.set(anim.id, anim);
					return map;
				},
				new Map<Guid, Animation>()
			) as ReadonlyMap<Guid, Animation>;
	}

	/** The list of other animations that target this animation, by name. */
	public get targetingAnimationsByName() {
		return this.context.animations
			.filter(anim => anim.targetIds.includes(this.id) && anim.name)
			.reduce(
				(map, anim) => {
					map.set(anim.name, anim);
					return map;
				},
				new Map<string, Animation>()
			) as ReadonlyMap<string, Animation>;
	}

	/** INTERNAL USE ONLY. Animations are created by loading prefabs with animations on them. */
	public constructor(private context: Context, id: Guid) {
		this._id = id;
	}

	/**
	 * Play the animation by setting its weight to `1`.
	 * @param reset If true, restart the animation from the beginning.
	 */
	public play(reset = false) {
		// no-op if already playing
		if (this.isPlaying) { return; }

		// Getter for basis time converts the internal _time var into the corresponding basis time,
		// so reassigning it writes this converted time back into the internal _basisTime var.
		this.basisTime = (reset ? Date.now() : this.basisTime)
			// start slightly in the future so we don't always skip over part of the animation.
			+ this.context.conn.quality.latencyMs.value / 1000;
		this.weight = 1;
	}

	/**
	 * Halt the running animation by setting its weight to `0`. Has no effect if the animation is already stopped.
	 */
	public stop() {
		// no-op if already stopped
		if (!this.isPlaying) { return; }
		this.weight = 0;
	}

	private _finished: ExportedPromise = null;
	/** @returns A promise that resolves when the animation completes. This only occurs if the wrap mode is set
	 * to "Once". The promise is not resolved if the animation is stopped manually.
	 */
	public finished(): Promise<void> {
		if (this._finished) {
			return this._finished.original;
		}

		const promise = new Promise<void>((resolve, reject) => {
			this._finished = { resolve, reject };
		});
		this._finished.original = promise;
		return promise;
	}

	private timeout: NodeJS.Timeout;
	/** Track the expected completion time of the animation, and flip everything off */
	private updateTimeout() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		if (this.wrapMode !== AnimationWrapMode.Once || !this.isPlaying || this.speed === 0) {
			return;
		}

		// if animation is running backward, stop one-shots when it reaches the beginning
		const basisTime = this.basisTime;
		const completionTime = Math.max(basisTime, basisTime + this.duration * 1000 / this.speed);

		this.timeout = setTimeout(() => {
			this.weight = 0;

			if (this._finished) {
				this._finished.resolve();
				this._finished = null;
			}
		}, completionTime - Date.now())
	}

	/** @hidden */
	public toJSON(): AnimationLike {
		return {
			id: this.id,
			name: this.name,
			basisTime: this._basisTime,
			time: this._time,
			speed: this.speed,
			weight: this.weight,
			wrapMode: this.wrapMode,
			dataId: this.dataId,
			targetIds: this.targetIds,
			duration: this.duration
		};
	}

	/** @hidden */
	public copy(patch: Partial<AnimationLike>): this {
		if (!patch) { return this; }
		this.internal.observing = false;
		if (patch.name !== undefined) { this.name = patch.name; }
		if (patch.basisTime !== undefined) { this.basisTime = patch.basisTime; }
		if (patch.speed !== undefined) { this.speed = patch.speed; }
		if (patch.weight !== undefined) { this.weight = patch.weight; }
		if (patch.wrapMode) { this.wrapMode = patch.wrapMode; }
		if (patch.dataId) { this._dataId = patch.dataId as Guid; }
		if (patch.targetIds) { this._targetIds = [...patch.targetIds]; }
		if (patch.duration !== undefined) { this._duration = patch.duration; }
		this.internal.observing = true;
		return this;
	}

	private animationChanged(...path: string[]) {
		if (this.internal.observing) {
			this.context.internal.incrementGeneration();
			this.internal.patch = this.internal.patch ?? {} as Partial<AnimationLike>;
			readPath(this, this.internal.patch, ...path);
		}
	}

	/**
	 * Animate an object's properties to a desired final state.
	 * @param context A valid MRE context.
	 * @param object The object to animate. Must be either an [[Actor]], an [[Animation]], or a [[Material]].
	 * @param options How the object should animate.
	 */
	public static async AnimateTo<T extends Animatible>(
		context: Context,
		object: T,
		options: AnimateToOptions<T>
	): Promise<Animation> {
		const tracks = [];
		const typeString =
			object instanceof Actor ? AnimatibleName.Actor :
				object instanceof Animation ? AnimatibleName.Animation :
					object instanceof Material ? AnimatibleName.Material :
						null;
		if (!typeString) {
			throw new Error(`Attempting to animate non-animatible object`);
		}

		// recursively search for fields with destinations
		// NOTE: This is all untyped because JS doesn't support types at runtime.
		// The function definition guarantees correct types anyway, so shouldn't be a problem.
		(function buildTracksRecursively(target: any, path: string) {
			for (const field in target) {
				if (typeof target[field] === 'object') {
					buildTracksRecursively(target[field], `${path}/${field}`);
				} else {
					// generate a track for each property
					tracks.push({
						target: path,
						// generate a single keyframe for the destination
						keyframes: [{
							time: options.duration,
							value: target[field],
							easing: options.easing
						}]
					});
				}
			}
		})(options.destination, `${typeString}:target`);

		// create the animation data
		const ac = new AssetContainer(context);
		const data = ac.createAnimationData('temp', {
			// force type assumptions
			tracks: (tracks as unknown) as Array<Track<AnimationProp>>
		});

		// bind to the object and play immediately
		const anim = await data.bind({ target: object }, { weight: 1, wrapMode: AnimationWrapMode.Once });
		anim.finished().then(() => ac.unload());

		return anim;
	}
}
