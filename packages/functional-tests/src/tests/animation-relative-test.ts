/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const AnimData: MRE.AnimationDataLike = { tracks: [{
	target: MRE.ActorPath("target").transform.local.rotation,
	relative: true,
	easing: MRE.AnimationEaseCurves.Linear,
	keyframes: [
		{ time: 1, value: MRE.Quaternion.FromEulerAngles(0, 0, -Math.PI / 2) }
	]
}]};

export default class AnimationRelativeTest extends Test {
	public expectedResultDescription = "Should spin smoothly";

	private assets: MRE.AssetContainer;

	public cleanup() {
		this.assets.unload();
	}

	public async run(root: MRE.Actor): Promise<boolean> {
		this.assets = new MRE.AssetContainer(this.app.context);
		const animData = this.assets.createAnimationData('anim', AnimData);
		const mesh = this.assets.createBoxMesh('mesh', 1, 0.5, 0.1);

		const target = MRE.Actor.Create(this.app.context, { actor: {
			name: "target",
			parentId: root.id,
			appearance: { meshId: mesh.id },
			transform: { local: { position: { y: 1, z: -1 }}}
		}});

		animData.bind({target}, { wrapMode: MRE.AnimationWrapMode.Loop, isPlaying: true });

		await this.stoppedAsync();
		return true;
	}
}
