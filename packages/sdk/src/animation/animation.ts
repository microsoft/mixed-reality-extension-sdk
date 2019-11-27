/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Guid } from '../types/guid';
import { AnimationWrapMode, InternalAnimation } from '.';
import { Patchable } from '../types/patchable';
import { Context } from '../types/runtime';
import readPath from '../utils/readPath';

/** A serialized animation definition */
export interface AnimationLike {
	/** Generated unique ID of this animation */
	id: Guid;
	/** The non-unique name of this animation */
	name: string;
	/** The server time (milliseconds since the UNIX epoch) when the animation was started */
	basisTime: number;
	/** The current playback time, based on basis time and speed */
	time: number;
	/** Playback speed multiplier */
	speed: number;
	/** When multiple animations play together, this is the relative strength of this instance */
	weight: number;
	/** What happens when the animation hits the last frame */
	wrapMode: AnimationWrapMode;
	/** What runtime objects are being animated */
	targetActors: Readonly<Guid[]>;

	/** The length in seconds of the animation */
	duration: number;
}

/** A runtime animation */
export class Animation implements AnimationLike, Patchable<AnimationLike> {
	/** @hidden */
	public internal = new InternalAnimation(this);

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
	public get basisTime() { return this._basisTime; }
	public set basisTime(val) {
		this._basisTime = val;
		this.animationChanged('basisTime');
	}

	private _speed = 0;
	/** @inheritdoc */
	public get speed() { return this._speed; }
	public set speed(val) {
		this._speed = val;
		this.animationChanged('speed');
	}

	private _weight = 1;
	/** @inheritdoc */
	public get weight() { return this._weight; }
	public set weight(val) {
		this._weight = val;
		this.animationChanged('weight');
	}

	private _wrapMode = AnimationWrapMode.Once;
	/** @inheritdoc */
	public get wrapMode() { return this._wrapMode; }
	public set wrapMode(val) {
		this._wrapMode = val;
		this.animationChanged('wrapMode');
	}

	private _targetActors: Guid[] = [];
	/** @inheritdoc */
	public get targetActors() { return Object.freeze([...this._targetActors]); }

	private _duration: number;
	/** @inheritdoc */
	public get duration() { return this._duration; }

	/** @inheritdoc */
	public get time() {
		if (this._speed !== 0) {
			return (Date.now() - this._basisTime) / this._speed;
		} else {
			return this._basisTime;
		}
	}

	/** INTERNAL USE ONLY. Animations are created by loading prefabs with animations on them. */
	public constructor(private context: Context, id: Guid) {
		this._id = id;
	}

	/** @hidden */
	public toJSON(): AnimationLike {
		return {
			id: this.id,
			name: this.name,
			basisTime: this.basisTime,
			time: this.time,
			speed: this.speed,
			weight: this.weight,
			wrapMode: this.wrapMode,
			targetActors: this.targetActors,
			duration: this.duration
		};
	}

	/** @hidden */
	public copy(patch: Partial<AnimationLike>): this {
		if (!patch) { return this; }
		if (patch.name !== undefined) { this._name = patch.name; }
		if (patch.basisTime !== undefined) { this._basisTime = patch.basisTime; }
		if (patch.speed !== undefined) { this._speed = patch.speed; }
		if (patch.weight !== undefined) { this._weight = patch.weight; }
		if (patch.wrapMode) { this._wrapMode = patch.wrapMode; }
		if (patch.targetActors) { this._targetActors = [...patch.targetActors]; }
		if (patch.duration !== undefined) { this._duration = patch.duration; }
		return this;
	}

	private animationChanged(...path: string[]) {
		if (this.internal.observing) {
			this.context.internal.incrementGeneration();
			this.internal.patch = this.internal.patch ?? {} as Partial<AnimationLike>;
			readPath(this, this.internal.patch, ...path);
		}
	}
}
