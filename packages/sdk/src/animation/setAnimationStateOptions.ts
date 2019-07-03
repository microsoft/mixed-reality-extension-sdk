/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Parameters to the `actor.setAnimationState` call.
 */
export type SetAnimationStateOptions = {
	/**
	 * The current animation time (in seconds). Negative values set the time to the animation's length.
	 */
	time?: number,
	/**
	 * The speed of animation playback. Negative values go backward.
	 */
	speed?: number,
	/**
	 * Whether to enable or disable the animation.
	 */
	enabled?: boolean,
};
