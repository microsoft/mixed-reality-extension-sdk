/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import readPath from '../../../utils/readPath';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface SoundLike {
	uri: string;
	duration: number;
}

export class Sound extends Asset implements SoundLike, Patchable<AssetLike> {
	// tslint:disable:variable-name
	private _uri: string;
	private _duration = 0;
	private _internal = new InternalAsset(this);
	// tslint:enable:variable-name

	/** @hidden */
	public get internal() { return this._internal; }

	/** The URI, if any, this sound was loaded from */
	public get uri() { return this._uri; }

	/** The length of the loaded sound in seconds at default pitch */
	public get duration() { return this._duration; }

	/** @inheritdoc */
	public get sound(): SoundLike { return this; }

	/** @hidden */
	public constructor(manager: AssetManager, def: AssetLike) {
		super(manager, def);

		if (!def.sound) {
			throw new Error("Cannot construct sound from non-sound definition");
		}

		if (def.sound.uri) {
			this._uri = def.sound.uri;
		}
		if (def.sound.duration) {
			this._duration = def.sound.duration;
		}
	}

	public copy(from: Partial<AssetLike>): this {
		if (!from) {
			return this;
		}

		// Pause change detection while we copy the values into the actor.
		const wasObserving = this.internal.observing;
		this.internal.observing = false;

		// tslint:disable:curly
		super.copy(from);
		if (from.sound && from.sound.uri)
			this._uri = from.sound.uri;
		if (from.sound && from.sound.duration !== undefined)
			this._duration = from.sound.duration;
		// tslint:enable:curly

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

}
