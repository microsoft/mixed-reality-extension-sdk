/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

/** Defines an animation control field */
interface ControlDefinition {
	/** Decorative label for the control */
	label: string;
	/** Changes a property, and returns a result string */
	action: (incr: number) => string;
	/** Whether the control should be updated on a timer */
	realtime?: boolean;
	/** The actor who's text needs to be updated */
	labelActor?: MRE.Actor;
}

export default class VideoSyncTest extends Test {
	public expectedResultDescription = "Tests Prerecorded video sync from an internet source";

	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	private CreateStreamInstance() {
		if (this.currentInstance) {
			this.currentInstance.stop();
		}
		this.currentInstance = this.parentActor.startVideoStream(this.videoStreams[this.currentStream].id,
			{
				volume: this.volume,
				looping: this.looping,
				spread: this.spread,
				rolloffStartDistance: this.rolloffStartDistance
			});
	}


	parentActor: MRE.Actor;
	videoStreams: MRE.VideoStream[];
	currentInstance: MRE.MediaInstance;
	currentStream = 0;
	isPlaying = true;
	

	volume = .2;
	looping = true;
	spread = 0.8;
	rolloffStartDistance = 2.5;

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.parentActor = MRE.Actor.Create(this.app.context, {
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
				uri: `youtube://U03lLvhBzOw`
			}
		);

		//Todo: More video sources and types for when support is patched in.
		// Non youtube?

		this.videoStreams = [videoStream1];

		await Promise.all([this.parentActor.created()]);

		this.CreateStreamInstance();

		const controls: ControlDefinition[] = [
			{
				label: "Playing", realtime: true, action: incr => {
					if (incr !== 0) {
						if (!this.isPlaying) {
							this.currentInstance.resume();
							this.isPlaying = true;
						} else {
							this.currentInstance.pause();
							this.isPlaying = false;
						}
					}
					return this.isPlaying.toString();
				}
			},
			{
				label: "Time", realtime: true, action: incr => {
					if (incr !== 0) {
						this.currentInstance.setState({ time: 10 });
					}
					return "Seek to 10 Seconds";
				}
			},
			{
				label: "Loop", action: incr => {
					this.looping = !this.looping;
					return this.looping.toString();
				}
			},
			{
				label: "Volume", action: incr => {
					if (incr > 0) {
						this.volume = this.volume >= 1.0 ? 1.0 : this.volume + .1;
					} else if (incr < 0) {
						this.volume = this.volume <= 0.0 ? 0.0 : this.volume - .1;
					}
					this.currentInstance.setState({ volume: this.volume });
					return Math.floor(this.volume * 100) + "%";
				}
			},
			{
				label: "Spread", action: incr => {
					if (incr > 0) {
						this.spread = this.spread >= 1.0 ? 1.0 : this.spread + .1;
					} else if (incr < 0) {
						this.spread = this.spread <= 0.0 ? 0.0 : this.spread - .1;
					}
					this.currentInstance.setState({ spread: this.spread });
					return Math.floor(this.spread * 100) + "%";
				}
			},
			{
			label: "Rolloff Start Distance", action: incr => {
				if (incr > 0) {
					this.rolloffStartDistance += .1;
				} else if (incr < 0) {
					this.rolloffStartDistance -= .1;
				}
				this.currentInstance.setState({ rolloffStartDistance: this.rolloffStartDistance });
				return this.rolloffStartDistance.toString();
				}
			},
			//Todo: Multiple videos
			//{
			// label: "Video Index", action: incr => {
			// 		if (incr > 0) {
			// 			this.currentStream += 1;
			// 			if(this.currentStream > 2) {
			// 				this.currentStream = 0;
			// 			}
			// 		} else if (incr < 0) {
			// 			this.currentStream -= 1;
			// 			if(this.currentStream < 0) {
			// 				this.currentStream = 1;
			// 			}
			// 		}
			// 		this.CreateStreamInstance();
			// 		return this.currentStream.toString();
			// 	}
			// }

		];
		this.createControls(controls, MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'controlsParent',
				parentId: root.id,
				transform: { local: { position: { x: 0.6, y: 1, z: -1 } } }
			}
		}));

		await this.stoppedAsync();
		return true;
	}

	private createControls(controls: ControlDefinition[], parent: MRE.Actor) {
		const arrowMesh = this.assets.createCylinderMesh('arrow', 0.01, 0.08, 'z', 3);
		const layout = new MRE.PlanarGridLayout(parent);

		let i = 0;
		const realtimeLabels = [] as ControlDefinition[];
		for (const controlDef of controls) {
			let label: MRE.Actor, more: MRE.Actor, less: MRE.Actor;
			layout.addCell({
				row: i,
				column: 1,
				width: 0.3,
				height: 0.25,
				contents: label = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-label`,
						parentId: parent.id,
						text: {
							contents: `${controlDef.label}:\n${controlDef.action(0)}`,
							height: 0.1,
							anchor: MRE.TextAnchorLocation.MiddleCenter,
							justify: MRE.TextJustify.Center,
							color: MRE.Color3.FromInts(255, 200, 255)
						}
					}
				})
			});
			controlDef.labelActor = label;

			layout.addCell({
				row: i,
				column: 0,
				width: 0.3,
				height: 0.25,
				contents: less = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-less`,
						parentId: parent.id,
						appearance: { meshId: arrowMesh.id },
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * 1.5) } }
					}
				})
			});

			layout.addCell({
				row: i,
				column: 2,
				width: 0.3,
				height: 0.25,
				contents: more = MRE.Actor.Create(this.app.context, {
					actor: {
						name: `${controlDef.label}-more`,
						parentId: parent.id,
						appearance: { meshId: arrowMesh.id },
						collider: { geometry: { shape: MRE.ColliderType.Auto } },
						transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * 0.5) } }
					}
				})
			});

			if (controlDef.realtime) { realtimeLabels.push(controlDef) }

			less.setBehavior(MRE.ButtonBehavior).onClick(() => {
				label.text.contents = `${controlDef.label}:\n${controlDef.action(-1)}`;
				for (const rt of realtimeLabels) {
					rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
				}
			});
			more.setBehavior(MRE.ButtonBehavior).onClick(() => {
				label.text.contents = `${controlDef.label}:\n${controlDef.action(1)}`;
				for (const rt of realtimeLabels) {
					rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
				}
			});

			i++;
		}
		layout.applyLayout();

		setInterval(() => {
			for (const rt of realtimeLabels) {
				rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
			}
		}, 250);
	}
}
