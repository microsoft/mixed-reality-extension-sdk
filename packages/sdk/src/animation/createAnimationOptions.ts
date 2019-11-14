/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	AnimationEvent,
	AnimationKeyframe,
	AnimationWrapMode,
	SetAnimationStateOptions
} from '.';

/**
 * Parameters to the `actor.createAnimation` call.
 */
export type CreateAnimationOptions = {
	/**
	 * The animation keyframes.
	 */
	keyframes: AnimationKeyframe[];
	/**
	 * The animation events. (Not implemented yet)
	 */
	events?: AnimationEvent[];
	/**
	 * How the animation should behave when it reaches the end.
	 */
	wrapMode?: AnimationWrapMode;
	/**
	 * Initial time, speed, and enabled state of the animation.
	 */
	initialState?: SetAnimationStateOptions;
};
