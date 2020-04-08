/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Animation, Material } from '..';

/** The types that support animation */
export type Animatible = Actor | Animation | Material;

/* eslint-disable no-shadow */
/** The names of types that support animation */
export enum AnimatibleName {
	Actor = 'actor',
	Animation = 'animation',
	Material = 'material'
}
/* eslint-enable no-shadow */

/**
 * Get an object's animation type.
 * @param obj The object you want the type for.
 * @returns An [[AnimatibleName]] value, or null if the object does not match an animatible type.
 * @hidden
 */
export function getAnimatibleName(obj: any) {
	if (obj instanceof Actor) {
		return AnimatibleName.Actor;
	} else if (obj instanceof Animation) {
		return AnimatibleName.Animation;
	} else if (obj instanceof Material) {
		return AnimatibleName.Material;
	} else {
		return null;
	}
}
