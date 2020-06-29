/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	Animatible,
	AnimatibleName,
	getAnimatibleName,
	Animation,
	AnimationLike,
	AnimationProp,
	AssetContainer,
	AssetLike,
	AssetUserType,
	EaseCurve,
	Guid,
	MreArgumentError,
	TargetPath,
} from '..';
import {
	Like,
	Patchable,
} from '../internal';
import { AssetInternal } from '../asset/assetInternal';
// break import cycle
import { Asset } from '../asset/asset';

/** The value of an animation property at a moment in time */
export type Keyframe<T extends AnimationProp> = {
	/** The time in seconds from the start of the animation.  */
	time: number;
	/** The property's value at this instant, or a reference to another property. */
	value: Like<T> | TargetPath<T>;
	/** How the value approaches this frame's value. Defaults to the track's easing values. */
	easing?: EaseCurve;
}

/** The timeline of values for an animation target property */
export type Track<T extends AnimationProp> = {
	/** A path to the property to animate */
	target: TargetPath<T>;
	/** The values to animate the target through */
	keyframes: Array<Keyframe<T>>;
	/** Whether the keyframe values are relative to 0 or to the target's current property value. Defaults to false. */
	relative?: boolean;
	/** Controls between-frame interpolation. Defaults to [[AnimationEaseCurves.Linear]]. */
	easing?: EaseCurve;
}

/** Keyframe data for an animation */
export interface AnimationDataLike {
	/** The animation keyframe data */
	tracks: Readonly<Array<Track<AnimationProp>>>;
}

export class AnimationData extends Asset implements AnimationDataLike, Patchable<AssetLike> {
	private _internal = new AssetInternal(this);
	public get internal() { return this._internal; }

	private _tracks: Array<Track<AnimationProp>>;

	/** @inheritdoc */
	public get tracks() { return this._tracks; }

	/** @inheritdoc */
	public get animationData(): AnimationData { return this; }

	/** @hidden */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.animationData) {
			throw new Error("Cannot construct animation data from non-animation data definition");
		}

		this.copy(def);
	}

	/** The length of the animation data. */
	public duration() {
		return this.tracks.reduce((trackMax, track) =>
			Math.max(trackMax, track.keyframes.reduce((kfMax, kf) =>
				Math.max(kfMax, kf.time), 0)), 0);
	}

	/** The placeholders and types of the animation's targets. */
	public targets() {
		return this.tracks
			// track targets (both direct and value targets)
			.reduce((paths, t) => {
				paths.push(
					t.target.toString().split('/')[0],
					...t.keyframes
						.map(k => TargetPath.Parse(k.value.toString())?.slice(0, 2)?.join(':'))
						.filter(val => !!val));
				return paths;
			}, [])
			// that are unique in the list
			.filter((target, i, arr) => arr.indexOf(target) === i)
			// and add their types/names to an object
			.reduce((obj, id) => {
				const [type, placeholder] = id.split(':');
				obj[placeholder] = type;
				return obj;
			}, {} as {[placeholder: string]: AnimatibleName});
	}

	/**
	 * Bind this animation data to one or more targets to create an [[Animation]].
	 * @param targets A map of placeholder names to real objects. The names and types must match those in [[targets]].
	 * @param initialState Initial properties for the new animation.
	 * @throws [[MreValidationError]] If the provided `targets` argument does not exactly match in contents and types
	 * to what the data expects. See [[targets]].
	 */
	public bind(
		targets: { [placeholder: string]: Animatible },
		initialState?: Partial<AnimationLike>
	): Promise<Animation> {
		// validate names and types
		const dataTargets = this.targets();
		const dataPlaceholders = new Set(Object.keys(dataTargets));
		const targetIds: { [placeholder: string]: Guid } = {};

		for (const placeholder in targets) {
			if (!dataPlaceholders.has(placeholder)) {
				throw new MreArgumentError(`Animation data "${this.name || this.id}" has no reference ` +
					`to placeholder "${placeholder}".`);
			} else if (getAnimatibleName(targets[placeholder]) !== dataTargets[placeholder]) {
				throw new MreArgumentError(`Placeholder "${placeholder}" for animation data ` +
					`"${this.name || this.id}" must be of type ${dataTargets[placeholder]}, ` +
					`got "${targets[placeholder].constructor.name}".`);
			}

			dataPlaceholders.delete(placeholder);

			targetIds[placeholder] = targets[placeholder].id;
		}

		// check for missing placeholders
		if (dataPlaceholders.size > 0) {
			throw new MreArgumentError(`Attempting to bind animation data "${this.name || this.id} ` +
				`without definitions for the required placeholders "${[...dataPlaceholders].join('", "')}".`);
		}

		return this.container.context.internal.createAnimationFromData(this.id, targetIds, initialState);
	}

	/** @hidden */
	public copy(from: Partial<AssetLike>): this {
		super.copy(from);
		if (!this._tracks && from?.animationData?.tracks) {
			this._tracks = [...from.animationData?.tracks];
		}
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			animationData: {
				tracks: this.tracks
			}
		};
	}

	/** @hidden */
	public breakReference(ref: AssetUserType) {
		if (!(ref instanceof Animation)) { return; }

		// animations don't work without data, so deregister if the data is unloaded
		if (ref.dataId === this.id) {
			this.container.context.internal.destroyAnimation(ref.id);
		}
	}

	/**
	 * Returns a list of problems with the data, or null if no problems.
	 * @hidden
	 */
	public static Validate(data: AnimationDataLike) {
		const errors: string[] = [];

		// make sure data has at least one track
		if (data.tracks.length === 0) {
			errors.push("Data must contain at least one track");
		}

		const maxTrackLen = data.tracks.reduce(
			(max, t) => Math.max(max, t.keyframes[t.keyframes.length - 1]?.time),
			-Infinity);

		for (let ti = 0; ti < data.tracks.length; ti++) {
			const t = data.tracks[ti];

			// make sure keyframes are in order by time
			for (let ki = 0; ki < t.keyframes.length; ki++) {
				const k = t.keyframes[ki];

				if (ki === 0) {
					if (k.time < 0) {
						errors.push(`Track ${ti} keyframe ${ki} time cannot be less than 0`);
					}
				} else if (k.time <= t.keyframes[ki - 1].time) {
					errors.push(`Track ${ti} keyframe ${ki} is out of sequence`);
				}

				if (k.easing) {
					if (k.easing[0] < 0 || k.easing[0] > 1) {
						errors.push(`Track ${ti} keyframe ${ki} easing[0] must be between 0 and 1`);
					}
					if (k.easing[2] < 0 || k.easing[2] > 1) {
						errors.push(`Track ${ti} keyframe ${ki} easing[2] must be between 0 and 1`);
					}
				}

				if (k.value instanceof TargetPath && t.relative) {
					errors.push(`Relative track ${ti} cannot contain keyframe ${ki}'s realtime value`);
				}
			}

			if (t.keyframes[t.keyframes.length - 1]?.time !== maxTrackLen) {
				errors.push(`Track ${ti} is a different length from the others`);
			}
		}

		return errors.length > 0 ? errors : null;
	}
}
