/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
	Actor,
	Animation,
	AnimationProp,
	Asset,
	AssetContainer,
	AssetLike,
	EaseCurve,
	Material,
	TargetPath,
} from '..';
import {
	Patchable
} from '../internal';
import { AssetInternal } from '../asset/assetInternal';

/** The names of types that support animation */
export enum AnimatibleName {
	Actor = 'actor', /* eslint-disable-line no-shadow */
	Animation = 'animation',
	Material = 'material'
}

/** The types that support animation */
export type Animatible = Actor | Animation | Material;

/** The timeline of values for an animation target property */
export type Track<T extends AnimationProp> = {
	/** A path to the property to animate */
	target: TargetPath<T>;
	/** The values to animate the target through */
	keyframes: Array<Keyframe<T>>;
}

/** The value of an animation property at a moment in time */
export type Keyframe<T extends AnimationProp> = {
	/** The time in seconds from the start of the animation.  */
	time: number;
	/** The property's value at this instant, or a reference to another property. */
	value: T | TargetPath<T>;
	/** Whether [[value]] is relative to 0 or to the target's current property value. */
	relative?: boolean;
	/** How the value approaches this frame's value. */
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

	/** The length of the animation data. */
	public get duration() {
		return this.tracks.reduce((trackMax, track) =>
			Math.max(trackMax, track.keyframes.reduce((kfMax, kf) =>
				Math.max(kfMax, kf.time), 0)), 0);
	}

	/** The names and types of the animation's targets. */
	public get targets() {
		return this.tracks
			// get root objects
			.map(t => t.target.toString().split('/')[0])
			// that are unique in the list
			.filter((target, i, arr) => arr.indexOf(target) === i)
			// and add their types/names to an object
			.reduce((obj, id) => {
				const [typeName, name] = id.split(':');
				if (/^actor|animation|material$/u.test(typeName)) {
					obj[name] = typeName as AnimatibleName;
				}
				return obj;
			}, {} as {[name: string]: AnimatibleName});
	}

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

	public bind(targets: { [name: string]: Animatible }) {

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
}
