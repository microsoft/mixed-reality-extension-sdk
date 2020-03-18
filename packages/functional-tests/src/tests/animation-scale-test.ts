/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const BounceHeightKeyframes: MRE.Keyframe<number>[] = [{
	time: 0,
	value: 0
}, {
	time: 0.2,
	value: -1
}, {
	time: 1,
	value: 1
}, {
	time: 1.8,
	value: 0
}];
const BounceRotKeyframes: MRE.Keyframe<MRE.Quaternion>[] = [];
const BounceScaleKeyframes: MRE.Keyframe<MRE.Vector3>[] = [];

export default class AnimationNativeTest extends Test {
	public expectedResultDescription = "Animate multiple properties of multiple actors";

	private assets: MRE.AssetContainer;
	private boxMesh: MRE.Mesh;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		this.boxMesh = this.assets.createBoxMesh("box", 0.3, 0.3, 0.3);

		// create cubes
		const cube0 = this.createCube(root, { x: 0, y: 0.15, z: -1 });

		// create anim
		const animData = this.assets.createAnimationData("bounce", { tracks: this.createAnimTracks(1) });
		const anim = await animData.bind({ cube0 }, { wrapMode: MRE.AnimationWrapMode.Loop });
		anim.play();

		await this.stoppedAsync();
		return true;
	}

	private createCube(root: MRE.Actor, position: MRE.Vector3Like) {
		const container = MRE.Actor.Create(this.app.context, { actor: {
			name: "Container",
			parentId: root.id,
			transform: { local: { position } }
		}});
		const cube = MRE.Actor.Create(this.app.context, { actor: {
			name: "Cube",
			parentId: container.id,
			appearance: { meshId: this.boxMesh.id }
		}});

		return cube;
	}

	private createAnimTracks(targetCount: number) {
		const tracks: MRE.Track<MRE.AnimationProp>[] = [];
		for (let i = 0; i < targetCount; i++) {
			tracks.push({
				target: MRE.ActorPath(`cube${i}`).transform.local.position.y,
				keyframes: BounceHeightKeyframes,
				easing: MRE.AnimationEaseCurves.Linear
			}/*, {
				target: MRE.ActorPath(`cube${i}`).transform.local.rotation,
				keyframes: BounceRotKeyframes
			}, {
				target: MRE.ActorPath(`cube${i}`).transform.local.scale,
				keyframes: BounceScaleKeyframes
			}*/);
		}
		return tracks;
	}
}
