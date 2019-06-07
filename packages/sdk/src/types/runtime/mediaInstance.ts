/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import UUID from 'uuid/v4';
import { log } from '../../log';
import { MediaCommand, SetMediaStateOptions } from '../../sound';
import { createForwardPromise, ForwardPromise } from '../forwardPromise';
import { Actor } from './actor';

export class MediaInstance {

	public id: string;
	public actor: Actor;
	private soundAssetId: string;

	constructor(actor: Actor, soundAssetId: string) {
		this.id = UUID();
		this.actor = actor;
		this.soundAssetId = soundAssetId;
	}

	public start(options: SetMediaStateOptions, startTimeOffset?: number):
		ForwardPromise<MediaInstance> {
		return createForwardPromise(this,
			new Promise<MediaInstance>((resolve, reject) => {
				this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
					this.actor.context.internal.setMediaState(
						this, MediaCommand.Start, options, this.soundAssetId, startTimeOffset);

					resolve();
				}).catch((reason: any) => {
					log.error(
						'app',
						`Failed Starting media on actor ${this.actor.id}. ${(reason || '').toString()}`.trim());
					reject();
				});
			})
		);
	}

	public setState(options: SetMediaStateOptions, mediaCommand?: MediaCommand) {
		this.actor.context.assetManager.assetLoaded(this.soundAssetId).then(() => {
			if (mediaCommand === undefined) {
				mediaCommand = MediaCommand.Update;
			}
			this.actor.context.internal.setMediaState(this, mediaCommand, options);
		}).catch((reason: any) => {
			log.error('app', `SetState failed ${this.actor.id}. ${(reason || '').toString()}`.trim());
		});
	}

	public pause() {
		this.setState({ paused: true });
	}

	public resume() {
		this.setState({ paused: false });
	}

	public stop() {
		this.setState({}, MediaCommand.Stop);
	}
}
