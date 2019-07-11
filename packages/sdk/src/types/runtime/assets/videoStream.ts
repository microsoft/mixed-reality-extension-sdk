/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface VideoStreamLike {
	uri: string;
	duration: number;
}

export class VideoStream extends Asset implements VideoStreamLike, Patchable<AssetLike> {
	// tslint:disable:variable-name
	private _uri: string;
	private _duration = 0;
	private _internal = new InternalAsset(this);
	// tslint:enable:variable-name

	/** @hidden */
	public get internal() { return this._internal; }

	/** The URI, if any, this videostream was loaded from */
	public get uri() { return this._uri; }

	/** The length of the loaded videostream in seconds */
	public get duration() { return this._duration; }

	/** @inheritdoc */
	public get videoStream(): VideoStreamLike { return this; }

	/** @hidden */
	public constructor(manager: AssetManager, def: AssetLike) {
		super(manager, def);

		if (!def.videoStream) {
			throw new Error("Cannot construct videoStream from non-videostream definition");
		}

		if (def.videoStream.uri) {
			this._uri = def.videoStream.uri;
		}
		if (def.videoStream.duration) {
			this._duration = def.videoStream.duration;
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
		if (from.videoStream && from.videoStream.uri)
			this._uri = from.videoStream.uri;
		if (from.videoStream && from.videoStream.duration !== undefined)
			this._duration = from.videoStream.duration;
		// tslint:enable:curly

		this.internal.observing = wasObserving;
		return this;
	}

	/** @hidden */
	public toJSON(): AssetLike {
		return {
			...super.toJSON(),
			videoStream: {
				uri: this.uri,
				duration: this.duration,
			}
		};
	}
}
