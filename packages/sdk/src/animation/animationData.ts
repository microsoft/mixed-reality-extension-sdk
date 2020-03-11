/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	Actor,
	AnimatibleName,
	Animation,
	AnimationLike,
	AnimationProp,
	AssetContainer,
	AssetLike,
	EaseCurve,
	Guid,
	Material,
	TargetPath,
} from '..';
import {
	Like,
	Patchable,
} from '../internal';
import { AssetInternal } from '../asset/assetInternal';
// break import cycle
import { Asset } from '../asset/asset';

/** The types that support animation */
export type Animatible = Actor | Animation | Material;

/** The timeline of values for an animation target property */
export type Track<T extends AnimationProp> = {
	/** A path to the property to animate */
	target: TargetPath<T>;
	/** The values to animate the target through */
	keyframes: Array<Keyframe<T>>;
	/** Whether the keyframe values are relative to 0 or to the target's current property value. Defaults to false. */
	relative?: boolean;
}

/** The value of an animation property at a moment in time */
export type Keyframe<T extends AnimationProp> = {
	/** The time in seconds from the start of the animation.  */
	time: number;
	/** The property's value at this instant, or a reference to another property. */
	value: Like<T> | TargetPath<T>;
	/** How the value approaches this frame's value. Defaults to linear. */
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
			throw new Error("Cannot construct mesh from non-animation data definition");
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
			// get root objects
			.map(t => t.target.toString().split('/')[0])
			// that are unique in the list
			.filter((target, i, arr) => arr.indexOf(target) === i)
			// and add their types/names to an object
			.reduce((obj, id) => {
				const [typeName, placeholder] = id.split(':');
				if (/^actor|animation|material$/u.test(typeName)) {
					obj[placeholder] = typeName as AnimatibleName;
				}
				return obj;
			}, {} as {[placeholder: string]: AnimatibleName});
	}

	/**
	 * Bind this animation data to one or more targets to create an [[Animation]].
	 * @param targets A map of placeholder names to real objects. The names and types must match those in [[targets]].
	 * @param initialState Initial properties for the new animation.
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
				throw new Error(`Animation data "${this.name || this.id}" has no reference ` +
					`to placeholder "${placeholder}".`);
			} else if (
				dataTargets[placeholder] === AnimatibleName.Actor && !(targets[placeholder] instanceof Actor) ||
				dataTargets[placeholder] === AnimatibleName.Animation && !(targets[placeholder] instanceof Animation) ||
				dataTargets[placeholder] === AnimatibleName.Material && !(targets[placeholder] instanceof Material)
			) {
				throw new Error(`Placeholder "${placeholder}" for animation data "${this.name || this.id}" ` +
					`must be of type ${dataTargets[placeholder]}, got "${targets[placeholder].constructor.name}".`);
			}

			dataPlaceholders.delete(placeholder);

			targetIds[placeholder] = targets[placeholder].id;
		}

		// check for missing placeholders
		if (dataPlaceholders.size > 0) {
			throw new Error(`Attempting to bind animation data "${this.name || this.id} without definitions ` +
				`for the required placeholders "${[...dataPlaceholders].join('", "')}".`);
		}

		return this.container.context.internal.createAnimationFromData(this.id, targetIds, initialState);
	}

	/** @hidden */
	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		super.copy(from);
		if (!this._tracks && from.animationData?.tracks) {
			this._tracks = [...from.animationData?.tracks];
		}

		this.internal.observing = wasObserving;
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
	public breakReference(ref: Actor | Asset) {
		if (!(ref instanceof Actor)) { return; }
		// TODO: break/destroy animations when this data is unloaded
	}

	/**
	 * Returns a list of problems with the data, or null if no problems.
	 * @hidden
	 */
	public static Validate(data: AnimationDataLike) {
		const ret: string[] = [];
		// TODO: validate data
		for (const t of data.tracks) {

		}
		return ret.length > 0 ? ret : null;
	}
}
