/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import { Context, MediaCommand, SetMediaStateOptions } from '../..';
import { log } from '../../log';

/**
 * A MediaInstance represents an instance managing the playback of a sound or video stream,
 * i.e. it plays an asset that was preloaded in an asset container
 */
export class MediaInstance {
	// tslint:disable-next-line: variable-name
	private _id: string;

	public get id() { return this._id; }
	public get actorId() { return this._actorId; }
	public get mediaAssetId() { return this._mediaAssetId; }

	// tslint:disable-next-line: variable-name
	constructor(private context: Context, private _actorId: string, private _mediaAssetId: string) {
		this._id = UUID();
	}

	/**
	 * @hidden
	 */
	public start(options: SetMediaStateOptions): MediaInstance {
		this.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.context.internal.setMediaState(
				this, MediaCommand.Start, options);
		}).catch(reason => {
			log.error('app', `Start failed ${this._actorId}. ${(reason || '').toString()}`.trim());
		});
		return this;
	}

	/**
	 * Updates the state of the active media
	 * @param options Adjustments to pitch and volume, and other characteristics.
	 */
	public setState(options: SetMediaStateOptions) {
		this.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.context.internal.setMediaState(this, MediaCommand.Update, options);
		}).catch((reason: any) => {
			log.error('app', `SetState failed ${this._actorId}. ${(reason || '').toString()}`.trim());
		});
	}

	/**
	 * Pause the media playback
	 */
	public pause() {
		this.setState({ paused: true });
	}

	/**
	 * Unpause the media playback
	 */
	public resume() {
		this.setState({ paused: false });
	}

	/**
	 * Finish the media playback and destroy the instance.
	 */
	public stop() {
		this.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.context.internal.setMediaState(this, MediaCommand.Stop);
		}).catch((reason: any) => {
			log.error('app', `Stop failed ${this._actorId}. ${(reason || '').toString()}`.trim());
		});
	}
}
