/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Animation, AnimationLike } from '.';
import { InternalPatchable } from '../types/patchable';

/** @hidden */
export class InternalAnimation implements InternalPatchable<AnimationLike> {
	public observing = true;
	public patch: Partial<AnimationLike>;

	public constructor(public animation: Animation) { }

	public getPatchAndReset() {
		const patch = this.patch;
		if (patch) {
			patch.id = this.animation.id;
			this.patch = null;
		}
		return patch;
	}
}
