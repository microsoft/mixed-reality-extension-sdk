/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, Animation, Material } from '..';

/** The types that support animation */
export type Animatible = Actor | Animation | Material;

/** The names of types that support animation */
export enum AnimatibleName {
	Actor = 'actor',
	Animation = 'animation',
	Material = 'material'
}

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

/**
 * Get an animation type from a target path.
 * @param target A target path string.
 * @returns An [[AnimatibleName]] value, or null if the argument is not a target path.
 * @hidden
 */
export function getAnimatibleNameFromTargetPath(targetPath: string) {
	for (const type of Object.values(AnimatibleName)) {
		if (targetPath.startsWith(type)) { return type; }
	}
	return null;
}
