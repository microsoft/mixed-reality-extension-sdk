/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const circleAnimData: MRE.AnimationDataLike = {
	tracks: [{
		target: MRE.ActorPath("target").transform.local.position,
		keyframes: [
			{ time: 0, value: { x: 0, y: 0, z: -0.5 } },
			{ time: 1, value: { x: 1, y: 1, z: -0.5 } },
			{ time: 2, value: { x: 0, y: 2, z: -0.5 } },
			{ time: 3, value: { x: -1, y: 1, z: -0.5 } },
			{ time: 4, value: { x: 0, y: 0, z: -0.5 } }
		]
	} as MRE.Track<MRE.Vector3>]
};

export default class LookAtTest extends Test {
	public expectedResultDescription = "No swivel, XY swivel, Y swivel";
	public interval: NodeJS.Timeout;
	public state = 0;
	public assets: MRE.AssetContainer;

	public cleanup() {
		clearInterval(this.interval);
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);

		MRE.Actor.Create(this.app.context, {
			actor: {
				name: "Light",
				parentId: root.id,
				light: {
					type: 'point',
					range: 5,
					intensity: 2,
					color: { r: 1, g: 0.5, b: 0.3 }
				},
				transform: {
					local: {
						position: { x: -2, y: 2, z: -2 }
					}
				}
			}
		});

		const tester = MRE.Actor.CreateFromGltf(this.assets, {
			uri: 'monkey.glb',
			actor: {
				parentId: root.id,
				transform: { local: { scale: { x: 0.5, y: 0.5, z: 0.5 } } }
			}
		});
		const lookAtTarget = MRE.Actor.Create(this.app.context, {
			actor: {
				parentId: root.id,
				attachment: {
					userId: this.user.id,
					attachPoint: 'head'
				}
			}
		});
		this.assets.createAnimationData('circle', circleAnimData)
			.bind({target: tester}, { isPlaying: true, wrapMode: MRE.AnimationWrapMode.Loop });

		this.interval = setInterval(() => {
			const modes = [MRE.LookAtMode.TargetXY, MRE.LookAtMode.TargetY, MRE.LookAtMode.None];
			tester.enableLookAt(lookAtTarget, modes[this.state++ % 3]);
		}, 4000);

		await this.stoppedAsync();
		return true;
	}
}
