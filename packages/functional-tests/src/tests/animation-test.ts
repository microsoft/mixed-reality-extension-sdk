/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class AnimationTest extends Test {
	public expectedResultDescription = "Click to toggle walk animation";

	private assets: MRE.AssetContainer;
	private animating = false;
	private prefab: MRE.Actor;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		this.prefab = MRE.Actor.CreateFromGltf(this.assets, {
			uri: `${this.baseUrl}/clock.gltf`,
			colliderType: 'box',
			actor: {
				parentId: root.id,
				transform: {
					local: {
						position: { y: 1, z: -1 },
						rotation: MRE.Quaternion.FromEulerAngles(Math.PI / 2, Math.PI, 0)
					}
				}
			}
		});

		/* this.prefab.setBehavior(MRE.ButtonBehavior)
			.onClick(() => this.setAnimationState(this.animating = !this.animating));
		*/

		await this.prefab.created();
		for (const anim of this.prefab.animations.values()) {
			console.log(`animation found: "${anim.name}" (${anim.id})`);
		}

		this.prefab.setBehavior(MRE.ButtonBehavior)
			.onClick(() => {
				const anim = this.prefab.animationsByName.get("animation:0");
				if (anim.isPlaying) {
					anim.stop();
				} else {
					anim.play();
				}
				const time = new Date(anim.basisTime).toLocaleTimeString();
				console.log(`${anim.isPlaying ? "starting" : "stopping"} - basis time: ${time}, time: ${anim.time}`)
			});

		await this.stoppedAsync();
		return true;
	}
}
