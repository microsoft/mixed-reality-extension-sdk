/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

interface ControlDefinition {
	label: string;
	action: (incr: number) => string;
	realtime?: boolean;
	labelActor?: MRE.Actor;
}

export default class AnimationTest extends Test {
	public expectedResultDescription = "Tweak an animation";

	private assets: MRE.AssetContainer;
	private timeout: NodeJS.Timeout;

	public cleanup() {
		clearInterval(this.timeout);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		const clock = MRE.Actor.CreateFromGltf(this.assets, {
			uri: `${this.baseUrl}/clock.gltf`,
			colliderType: 'box',
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { x: -0.6, y: 1, z: -1 },
						rotation: MRE.Quaternion.FromEulerAngles(Math.PI / 2, Math.PI, 0)
					}
				}
			}
		});

		await clock.created();
		const anim = clock.animationsByName.get("animation:0");

		const controls: ControlDefinition[] = [
			{ label: "Playing", realtime: true, action: incr => {
				if (!incr) {
					return anim.isPlaying.toString();
				} else if (anim.isPlaying) {
					anim.stop();
					return "false";
				} else {
					anim.play();
					return "true";
				}
			} },
			{ label: "Time", realtime: true, action: incr => {
				if (incr > 0) {
					anim.time += 1;
				} else if (incr < 0) {
					anim.time -= 1;
				}
				return anim.time.toFixed(3);
			}},
			{ label: "Speed", action: incr => {
				if (incr > 0) {
					anim.speed += 0.25;
				} else if (incr < 0) {
					anim.speed -= 0.25;
				}
				return Math.floor(anim.speed * 100) + "%";
			}},
			{ label: "Wrap", action: incr => {
				const modes = Object.values(MRE.AnimationWrapMode);
				const curModeIndex = modes.findIndex(m => m === anim.wrapMode);
				const newModeIndex = (curModeIndex + incr + modes.length) % modes.length;
				anim.wrapMode = modes[newModeIndex];
				return anim.wrapMode;
			}}
		];
		this.createControls(controls, MRE.Actor.Create(this.app.context, {
			actor: {
				name: 'controlsParent',
				parentId: root.id,
				transform: { local: { position: { x: 0.6, y: 1, z: -1 } } }
			}
		}));

		anim.finished().then(() => this.app.setOverrideText('finished'));

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
				contents: label = MRE.Actor.Create(this.app.context, { actor: {
					name: `${controlDef.label}-label`,
					parentId: parent.id,
					text: {
						contents: `${controlDef.label}:\n${controlDef.action(0)}`,
						height: 0.1,
						anchor: MRE.TextAnchorLocation.MiddleCenter,
						justify: MRE.TextJustify.Center,
						color: MRE.Color3.FromInts(255, 200, 255)
					}
				}})
			});
			controlDef.labelActor = label;

			layout.addCell({
				row: i,
				column: 0,
				width: 0.3,
				height: 0.25,
				contents: less = MRE.Actor.Create(this.app.context, { actor: {
					name: `${controlDef.label}-less`,
					parentId: parent.id,
					appearance: { meshId: arrowMesh.id },
					collider: { geometry: { shape: MRE.ColliderType.Auto } },
					transform: { local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI * 1.5) } }
				}})
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

		this.timeout = setInterval(() => {
			for (const rt of realtimeLabels) {
				rt.labelActor.text.contents = `${rt.label}:\n${rt.action(0)}`;
			}
		}, 250);
	}
}
