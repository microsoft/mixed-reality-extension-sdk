/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { App } from '../app';
import { Test } from '../test';

export default class VideoTest extends Test {
	public expectedResultDescription = "Play a couple youtube videos. Click to cycle.";

	constructor(app: App, baseUrl: string, user: MRE.User) {
		super(app, baseUrl, user);
	}

	private _state = 0;

	public async run(root: MRE.Actor): Promise<boolean> {
		const parentActor = await MRE.Actor.CreateEmpty(this.app.context, {
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

		const videoStreamPromise1 = this.app.context.assetManager.createVideoStream(
			'group1',
			{
				videoSourceType: MRE.VideoSourceType.YouTube,
				uri: `1roy4o4tqQM`
				// `z1YNh9BQVRg`
			}
		);
		const videoStreamPromise2 = this.app.context.assetManager.createVideoStream(
			'group1',
			{
				videoSourceType: MRE.VideoSourceType.YouTube,
				uri: `9RTaIpVuTqE`
			}
		);
		let videoInstance: MRE.ForwardPromise<MRE.MediaInstance>;
		const cycleState = () => {
			switch (this._state) {
				case 0:
					this.app.setOverrideText("Playing Movie 1!");
					videoInstance = parentActor.startVideoStream(videoStreamPromise1.value.id,
						{
							volume: 0.2,
							looping: true,
							doppler: 0.0,
							spread: 0.7,
							rolloffStartDistance: 2.5
						},
						0.0);
					break;
				case 1:
					this.app.setOverrideText("Pausing!");
					videoInstance.value.pause();
					break;
				case 2:
					this.app.setOverrideText("Resuming!");
					videoInstance.value.resume();
					break;
				case 3:
					this.app.setOverrideText("Raising volume!");
					videoInstance.value.setState(
						{
							volume: 0.5
						});
					break;
				case 4:
					this.app.setOverrideText("Making sound fully directional!");
					videoInstance.value.setState(
						{
							spread: 0.0
						});
					break;
				case 5:
					this.app.setOverrideText("Seeking!");
					videoInstance.value.setState(
						{
							Time: 60.0
						});
					break;
				case 6:
					this.app.setOverrideText("Hiding!");
					videoInstance.value.setState(
						{
							Visible: false
						});
					break;
				case 7:
					this.app.setOverrideText("unhiding!");
					videoInstance.value.setState(
						{
							Visible: true
						});
					break;
				case 8:
					this.app.setOverrideText("Switching to movie 2!");
					videoInstance.value.stop();
					videoInstance = parentActor.startVideoStream(videoStreamPromise2.value.id,
						{
							volume: 0.2,
							looping: true,
							doppler: 0.0,
							spread: 0.7,
							rolloffStartDistance: 2.5
						},
						0.0);
					break;
				case 9:
					this.app.setOverrideText("Stopping!");
					videoInstance.value.stop();
					this._state = -1;
					break;

				default:
					throw new Error("How did we get here?");
			}
			this._state += 1;
		};
		cycleState();

		const buttonPromise = MRE.Actor.CreatePrimitive(this.app.context, {
			definition: {
				shape: MRE.PrimitiveShape.Sphere,
				radius: 0.2,
				uSegments: 8,
				vSegments: 4

			},
			addCollider: true,
			actor: {
				name: 'Button',
				parentId: root.id,
				transform: {
					local: {
						position: { x: -0.8, y: 0.2, z: 0 }
					}
				}
			}
		});

		const buttonBehavior = buttonPromise.value.setBehavior(MRE.ButtonBehavior);
		buttonBehavior.onButton('released', cycleState);

		await this.stoppedAsync();
		return true;
	}
}
