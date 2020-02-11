/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Asset, AssetContainer, AssetLike } from '..';
import { Patchable } from '../internal';
import { AssetInternal } from './assetInternal';

export interface SoundLike {
	uri: string;
	duration: number;
}

export class Sound extends Asset implements SoundLike, Patchable<AssetLike> {
	private _uri: string;
	private _duration = 0;
	private _internal = new AssetInternal(this);

	/** @hidden */
	public get internal() { return this._internal; }

	/** The URI, if any, this sound was loaded from */
	public get uri() { return this._uri; }

	/** The length of the loaded sound in seconds at default pitch */
	public get duration() { return this._duration; }

	/** @inheritdoc */
	public get sound(): Sound { return this; }

	/** @hidden */
	public constructor(container: AssetContainer, def: AssetLike) {
		super(container, def);

		if (!def.sound) {
			throw new Error("Cannot construct sound from non-sound definition");
		}

		this.copy(def);
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		super.copy(from);
		if (from.sound && from.sound.uri) {
			this._uri = from.sound.uri;
		}
		if (from.sound && from.sound.duration !== undefined) {
			this._duration = from.sound.duration;
		}

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			sound: {
				uri: this.uri,
				duration: this.duration,
			}
		};
	}

	/** @hidden */
	public breakReference(ref: Actor | Asset) {
		if (!(ref instanceof Actor)) { return; }

		// TODO: Destroy all SoundInstances playing this Sound
	}
}
