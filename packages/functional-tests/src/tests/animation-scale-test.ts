/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const BounceHeightKeyframes: Array<MRE.Keyframe<number>> = [
	{ time: 0, value: -0.1 },
	{ time: 0.5, value: 1 },
	{ time: 0.85, value: 0, easing: MRE.AnimationEaseCurves.EaseInQuadratic },
	{ time: 1, value: -0.1 }];
const BounceRotKeyframes: Array<MRE.Keyframe<MRE.Quaternion>> = [
	{ time: 0, value: MRE.Quaternion.Identity() },
	{ time: 0.33, value: MRE.Quaternion.FromEulerAngles(0, 2 * Math.PI / 3, 0) },
	{ time: 0.67, value: MRE.Quaternion.FromEulerAngles(0, 4 * Math.PI / 3, 0) },
	{ time: 1, value: MRE.Quaternion.Identity() }];
const BounceScaleKeyframes: Array<MRE.Keyframe<MRE.Vector3>> = [
	{ time: 0, value: { x: 1.33, y: 0.667, z: 1.33 }, easing: MRE.AnimationEaseCurves.EaseInQuadratic },
	{ time: 0.15, value: { x: 0.667, y: 1.33, z: 0.667 } },
	{ time: 0.85, value: { x: 0.667, y: 1.33, z: 0.667 }, easing: MRE.AnimationEaseCurves.Step },
	{ time: 1, value: { x: 1.33, y: 0.667, z: 1.33 } },
];

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
		const targets: { [placeholder: string]: MRE.Actor } = {
			cube0: this.createCube(root, { x: -0.5, y: 0.15, z: -0.5 }),
			cube1: this.createCube(root, { x: 0, y: 0.15, z: -0.5 }),
			cube2: this.createCube(root, { x: 0.5, y: 0.15, z: -0.5 }),
			cube3: this.createCube(root, { x: -0.75, y: 0.15, z: -1 }),
			cube4: this.createCube(root, { x: -0.25, y: 0.15, z: -1 }),
			cube5: this.createCube(root, { x: 0.25, y: 0.15, z: -1 }),
			cube6: this.createCube(root, { x: 0.75, y: 0.15, z: -1 }),
			cube7: this.createCube(root, { x: -0.5, y: 0.15, z: -1.5 }),
			cube8: this.createCube(root, { x: 0, y: 0.15, z: -1.5 }),
			cube9: this.createCube(root, { x: 0.5, y: 0.15, z: -1.5 }),
		};

		// create anim
		const animData = this.assets.createAnimationData("bounce", { tracks: this.createAnimTracks(10) });
		const anim = await animData.bind(targets, { wrapMode: MRE.AnimationWrapMode.Loop });
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
		const tracks: Array<MRE.Track<MRE.AnimationProp>> = [];
		for (let i = 0; i < targetCount; i++) {
			tracks.push({
				target: MRE.ActorPath(`cube${i}`).transform.local.position.y,
				keyframes: BounceHeightKeyframes,
				easing: MRE.AnimationEaseCurves.EaseOutQuadratic
			}, {
				target: MRE.ActorPath(`cube${i}`).transform.local.rotation,
				keyframes: BounceRotKeyframes,
				easing: MRE.AnimationEaseCurves.Linear
			}, {
				target: MRE.ActorPath(`cube${i}`).transform.local.scale,
				keyframes: BounceScaleKeyframes,
				easing: MRE.AnimationEaseCurves.EaseOutQuadratic
			});
		}
		return tracks;
	}
}
