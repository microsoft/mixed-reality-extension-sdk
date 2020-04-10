/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const AnimData: MRE.AnimationDataLike = { tracks: [{
	target: MRE.ActorPath("target1").transform.local.position.y,
	easing: MRE.AnimationEaseCurves.Linear,
	keyframes: [{
		time: 0,
		value: -0.5
	}, {
		time: 1,
		value: 0.5
	}]
}, {
	target: MRE.ActorPath("target2").transform.local.position.y,
	easing: MRE.AnimationEaseCurves.Linear,
	keyframes: [{
		time: 0,
		value: -0.5
	}, {
		time: 1,
		value: 0.5
	}]
}]};

export default class AnimationSyncTest extends Test {
	public expectedResultDescription = "Two animations targeting one object should cancel.";

	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const anim = this.assets.createAnimationData('anim', AnimData);
		const mesh = this.assets.createSphereMesh('mesh', 0.1);

		const animRoot = MRE.Actor.Create(this.app.context, { actor: {
			name: 'animRoot',
			parentId: root.id,
			transform: { local: { position: { y: 1, z: -1 }}},
		}})
		const ball1 = MRE.Actor.Create(this.app.context, { actor: {
			name: 'ball1',
			parentId: animRoot.id,
			transform: { local: { position: { x: -1 }}},
			appearance: { meshId: mesh.id }
		}});
		const ball2 = MRE.Actor.Create(this.app.context, { actor: {
			name: 'ball2',
			parentId: animRoot.id,
			appearance: { meshId: mesh.id }
		}});
		const ball3 = MRE.Actor.Create(this.app.context, { actor: {
			name: 'ball3',
			parentId: animRoot.id,
			transform: { local: { position: { x: 1 }}},
			appearance: { meshId: mesh.id }
		}});

		// create two animations, 180 degrees out of phase, targeting the same object (ball2)
		anim.bind(
			{ target1: ball1, target2: ball2 },
			{ isPlaying: true, wrapMode: MRE.AnimationWrapMode.PingPong });
		anim.bind(
			{ target1: ball3, target2: ball2 },
			{ isPlaying: true, wrapMode: MRE.AnimationWrapMode.PingPong, time: anim.duration() });

		await this.stoppedAsync();
		return true;
	}
}
