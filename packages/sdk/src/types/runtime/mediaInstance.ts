/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import { MediaCommand, SetMediaStateOptions } from '../..';
import { log } from '../../log';
import { Actor } from './actor';

/**
 * A MediaInstance represents an instance managing the playback of a sound or video stream,
 * i.e. it plays an asset that was preloaded in an asset container
 */
export class MediaInstance {

	public id: string;
	public actor: Actor;
	private mediaAssetId: string;

	constructor(actor: Actor, mediaAssetId: string) {
		this.id = UUID();
		this.actor = actor;
		this.mediaAssetId = mediaAssetId;
	}

	/**
	 * @hidden
	 */
	public start(options: SetMediaStateOptions, startTimeOffset?: number): MediaInstance {
		this.actor.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.actor.context.internal.setMediaState(
				this, MediaCommand.Start, options, this.mediaAssetId, startTimeOffset);
		}).catch(reason => {
			log.error('app', `Start failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
		});
		return this;
	}

	/**
	 * Updates the state of the active media
	 * @param options Adjustments to pitch and volume, and other characteristics.
	 */
	public setState(options: SetMediaStateOptions) {
		this.actor.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.actor.context.internal.setMediaState(this, MediaCommand.Update, options);
		}).catch((reason: any) => {
			log.error('app', `SetState failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
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
		this.actor.context.internal.lookupAsset(this.mediaAssetId).created.then(() => {
			this.actor.context.internal.setMediaState(this, MediaCommand.Stop);
		}).catch((reason: any) => {
			log.error('app', `Stop failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
		});
	}
}
