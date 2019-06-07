/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Asset, AssetLike, AssetManager } from '.';
import readPath from '../../../utils/readPath';
import { InternalAsset } from '../../internal/asset';
import { Patchable } from '../../patchable';

export interface VideoStreamLike {
	videoSourceType: VideoSourceType;
	uri: string;
	duration: number;
}

/** Type describing how to interpret the video Source URI. */
export enum VideoSourceType {
	/** URI is just a Raw URL. */
	Raw = 'raw',
	/** URI is Mixer.com stream. */
	Mixer = 'mixer',
	/** URI is Twitch stream. */
	Twitch = 'twitch',
	/** URI is a YouTube video or live stream. */
	YouTube = 'youtube'
}

export class VideoStream extends Asset implements VideoStreamLike, Patchable<AssetLike> {
	// tslint:disable:variable-name
	private _videoSourceType: VideoSourceType;
	private _uri: string;
	private _duration = 0;
	private _internal = new InternalAsset(this);
	// tslint:enable:variable-name

	/** @hidden */
	public get internal() { return this._internal; }

	/** The VideoSourceType, if any, this videostream was loaded from */
	public get videoSourceType() { return this._videoSourceType; }

	/** The URI, if any, this videostream was loaded from */
	public get uri() { return this._uri; }

	/** The length the loaded videostream */
	public get duration() { return this._duration; }

	/** @inheritdoc */
	public get videoStream(): VideoStreamLike { return this; }

	/** @hidden */
	public constructor(manager: AssetManager, def: AssetLike) {
		super(manager, def);

		if (!def.videoStream) {
			throw new Error("Cannot construct videoStream from non-videostream definition");
		}

		if (def.videoStream.videoSourceType) {
			this._videoSourceType = def.videoStream.videoSourceType;
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
		if (from.videoStream && from.videoStream.videoSourceType)
			this._videoSourceType = from.videoStream.videoSourceType;
		if (from.videoStream && from.videoStream.uri)
			this._uri = from.videoStream.uri;
		if (from.videoStream && from.videoStream.duration)
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
				videoSourceType: this.videoSourceType,
				uri: this.uri,
				duration: this.duration,
			}
		};
	}

}
