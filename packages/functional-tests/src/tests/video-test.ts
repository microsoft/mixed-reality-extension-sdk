/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { App } from '../app';
import { Test } from '../test';

export default class VideoTest extends Test {
	public expectedResultDescription = "Play a couple youtube videos. Click to cycle.";
	private assets: MRE.AssetContainer;
	private _state = 0;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const parentActor = MRE.Actor.Create(this.app.context, {
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

		const videoStream1 = this.assets.createVideoStream(
			'stream1',
			{
				uri: `youtube://1roy4o4tqQM`
				// `youtube://z1YNh9BQVRg`
			}
		);
		const videoStream2 = this.assets.createVideoStream(
			'stream2',
			{
				uri: `youtube://9RTaIpVuTqE`
			}
		);
		let videoInstance: MRE.MediaInstance;
		const cycleState = () => {
			switch (this._state) {
				case 0:
					this.app.setOverrideText("Playing Movie 1!");
					videoInstance = parentActor.startVideoStream(videoStream1.id,
						{
							volume: 0.2,
							looping: true,
							spread: 0.7,
							rolloffStartDistance: 2.5
						});
					break;
				case 1:
					this.app.setOverrideText("Pausing!");
					videoInstance.pause();
					break;
				case 2:
					this.app.setOverrideText("Resuming!");
					videoInstance.resume();
					break;
				case 3:
					this.app.setOverrideText("Raising volume!");
					videoInstance.setState(
						{
							volume: 0.5
						});
					break;
				case 4:
					this.app.setOverrideText("Making sound fully directional!");
					videoInstance.setState(
						{
							spread: 0.0
						});
					break;
				case 5:
					this.app.setOverrideText("Seeking!");
					videoInstance.setState(
						{
							time: 60.0
						});
					break;
				case 6:
					this.app.setOverrideText("Hiding!");
					videoInstance.setState(
						{
							visible: false
						});
					break;
				case 7:
					this.app.setOverrideText("unhiding!");
					videoInstance.setState(
						{
							visible: true
						});
					break;
				case 8:
					this.app.setOverrideText("Switching to movie 2!");
					videoInstance.stop();
					videoInstance = parentActor.startVideoStream(videoStream2.id,
						{
							volume: 0.2,
							looping: true,
							spread: 0.7,
							rolloffStartDistance: 2.5
						});
					break;
				case 9:
					this.app.setOverrideText("Stopping!");
					videoInstance.stop();
					this._state = -1;
					break;

				default:
					throw new Error("How did we get here?");
			}
			this._state += 1;
		};
		cycleState();

		const buttonActor = MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'Button',
				parentId: root.id,
				appearance: {
					meshId: this.assets.createSphereMesh('sphere', 0.2).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: { x: -0.8, y: 0.2, z: 0 }
					}
				}
			}
		});

		const buttonBehavior = buttonActor.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onButton('released', cycleState);

		await this.stoppedAsync();
		return true;
	}
}
