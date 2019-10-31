/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { App } from '../app';
import { Test } from '../test';

import {
	VideoPlayerManager
} from '@microsoft/mixed-reality-extension-altspacevr-extras';

export default class AltspaceVRVideoTest extends Test {
	public expectedResultDescription = "Play a couple youtube videos. Click to cycle.";

	// Note that videoPlayerManager is deprecated. Please use Actor.startVideoStream() instead.
	/* tslint:disable-next-line */
	private videoPlayerManager: VideoPlayerManager;
	private assets: MRE.AssetContainer;

	constructor(app: App, baseUrl: string, user: MRE.User) {
		super(app, baseUrl, user);
		/* tslint:disable-next-line */
		this.videoPlayerManager = new VideoPlayerManager(app.context);
		this.assets = new MRE.AssetContainer(this.app.context);
	}
	public cleanup() {
		this.videoPlayerManager.cleanup();
		this.assets.unload();
	}

	private _state = 0;

	public async run(root: MRE.Actor): Promise<boolean> {
		const video = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				name: 'video',
				transform: {
					local: {
						position: { x: 0, y: 1, z: 0 },
						scale: { x: 2, y: 2, z: 2 }
					}
				},
			}
		});

		const cycleState = () => {
			if (this._state === 0) {
				this.app.setOverrideText("Playing Movie!");
				this.videoPlayerManager.play(
					video.id,
					'https://www.youtube.com/watch?v=z1YNh9BQVRg',
					0.0);
			} else if (this._state === 1) {
				this.app.setOverrideText("Switched Movie!");
				this.videoPlayerManager.play(
					video.id,
					'https://www.youtube.com/watch?v=UowkIRSDHfs',
					0.0);
			} else if (this._state === 2) {
				this.app.setOverrideText("Stopped Movie!");
				this.videoPlayerManager.stop(video.id);
			}

			this._state = (this._state + 1) % 3;
		};
		cycleState();

		const button = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Button',
				parentId: root.id,
				appearance: {
					meshId: this.assets.createSphereMesh('spherebutton', 0.2).id
				},
				transform: {
					local: {
						position: { x: -0.8, y: 0.2, z: 0 }
					}
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } }
			}
		});

		const buttonBehavior = button.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onButton('released', cycleState);

		await this.stoppedAsync();
		return true;
	}
}
