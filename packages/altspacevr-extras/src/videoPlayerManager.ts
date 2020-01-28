/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	Context,
	Guid,
	User
} from '@microsoft/mixed-reality-extension-sdk';

type Video = { url: string; basisTime: number };

/**
 * @deprecated
 * This VideoPlayerManager is deprecated and will be removed in the future
 * Instead, please use AssetManager.createVideoStream() and Actor.startVideoStream()
 */

export class VideoPlayerManager {
	private videos = new Map<Guid, Video>();

	constructor(private context: Context) {
		this.context.onUserJoined(this.userJoined);
	}

	public cleanup() {
		this.context.offUserJoined(this.userJoined);
	}

	private userJoined = (user: User) => {
		for (const entry of this.videos) {
			const [actorId, video] = entry;
			this.context.rpc.send({
				procName: 'VideoPlay',
				userId: user.id
			}, {
				parentId: actorId,
				URL: video.url,
				startTime: video.basisTime + Date.now() / 1000.0
			});
		}
	};

	public play(actorId: Guid, url: string, startTime: number) {
		if (!this.videos.has(actorId) || this.videos.get(actorId).url !== url) {
			const video = { url, basisTime: startTime - Date.now() / 1000.0 };
			this.videos.set(actorId, video);
			this.context.rpc.send({
				procName: 'VideoPlay'
			}, {
				parentId: actorId,
				URL: url,
				startTime
			});
		}
	}

	public stop(actorId: Guid) {
		if (this.videos.has(actorId)) {
			this.context.rpc.send({
				procName: 'VideoPlay'
			}, {
				parentId: actorId,
				URL: '', startTime: 0.0
			});
			this.videos.delete(actorId);
		}
	}
}
