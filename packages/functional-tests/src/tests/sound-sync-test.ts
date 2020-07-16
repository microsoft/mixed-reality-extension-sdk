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

export default class SoundSyncTest extends Test {
	public expectedResultDescription = "Tests Prerecorded sound playback synchronization";

	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	private CreateSoundInstance() {
		if (this.currentInstance) {
			this.currentInstance.stop();
		}
		this.currentInstance = this.parentActor.startSound(this.soundAssets[this.currentInstanceIndex].id,
			{
				volume: this.volume,
				looping: this.looping,
				pitch: this.pitch,
			});
	}


	parentActor: MRE.Actor;
	soundAssets: MRE.Sound[];
	currentInstance: MRE.MediaInstance;
	currentInstanceIndex = 0;
	isPlaying = true;
	

	volume = .2;
	looping = true;
	pitch = 0;
	time = 0;

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

		const soundAsset1 = this.assets.createSound(
			'music',
			{ uri: `${this.baseUrl}/Counting.wav` }
		);

		//Todo: More video sources and types for when support is patched in.
		// Non youtube?

		this.soundAssets = [soundAsset1];

		await Promise.all([this.parentActor.created()]);

		this.CreateSoundInstance();

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
				label: "Loop", action: incr => {
					this.looping = !this.looping;
					this.currentInstance.setState({looping: this.looping});
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
			}
			//Todo: Multiple sounds


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
