/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Guid } from '../types/guid';
import { AnimationWrapMode } from '.';
import { Patchable } from '../types/patchable';

/** A serialized animation definition */
export interface AnimationLike {
	/** Generated unique ID */
	id: Readonly<Guid>;
	time: number;
	speed: number;
	weight: number;
	wrapMode: AnimationWrapMode;
}

export class Animation implements AnimationLike, Patchable<AnimationLike> {

}
