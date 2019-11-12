/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Guid } from '../types/guid';
import { AnimationWrapMode } from '.';
import { Patchable } from '../types/patchable';

/** A serialized animation definition */
export interface AnimationLike {
	/** Generated unique ID */
	id: Readonly<Guid>;
	/** The current playback time, based on start time and speed */
	time: number;
	/** Playback speed multiplier */
	speed: number;
	/** When multiple animations play together, this is the relative strength of this instance */
	weight: number;
	/** What happens when the animation hits the last frame */
	wrapMode: AnimationWrapMode;
}

/** A runtime animation */
export class Animation implements AnimationLike, Patchable<AnimationLike> {
	private _id: Guid;
	private _basisTime: number;
	private _speed = 0;
	private _weight = 1;
	private _wrapMode = AnimationWrapMode.Once;
	/** @inheritdoc */
	public get id() { return this._id; }
	/** @inheritdoc */
	public get time() {
		if (this._speed !== 0) {
			return (Date.now() - this._basisTime) / this._speed;
		} else {
			return this._basisTime;
		}
	}
	/** @inheritdoc */
	public get speed() { return this._speed; }
	/** @inheritdoc */
	public get weight() { return this._weight; }
	/** @inheritdoc */
	public get wrapMode() { return this._wrapMode; }
}
