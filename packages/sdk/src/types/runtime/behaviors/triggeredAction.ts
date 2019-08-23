/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActionHandler, SetAudioStateOptions } from '../../..';

/**
 * Describes and action handler with an associated triggered action.
 */
export type ActionHandlerWithTriggeredAction = {
	handler?: ActionHandler;
	triggeredAction?: TriggeredAction;
};

/**
 * Plays an animation in response to the associated event when fired.
 */
export type PlayAnimationTriggeredAction = {
	type: 'play-animation',
	/**
	 * The name of the animation to play.
	 */
	animationName: string,
	/**
	 * The actor on which to play the animation. If omitted, the animation plays on the actor associated with
	 * the event that fired.
	 */
	targetId?: string
};

/**
 * Stops an animation in response to the associated event when fired.
 */
export type StopAnimationTriggeredAction = {
	type: 'stop-animation',
	/**
	 * The name of the animation to stop.
	 */
	animationName: string,
	/**
	 * The actor on which to stop the animation. If omitted, the animation plays on the actor associated with
	 * the event that fired.
	 */
	targetId?: string
};

/**
 * Plays a sound in response to the associated event when fired.
 */
export type PlaySoundTriggeredAction = {
	type: 'play-sound',
	/**
	 * The assetId of the sound to play.
	 */
	assetId: string,
	/**
	 * The actor on which to play the sound. If omitted, the sound plays on the actor associated with
	 * the event that fired.
	 */
	targetId?: string,
	/**
	 * Optional sound configuration such as volume, pitch, etc.
	 */
	options?: SetAudioStateOptions
};

/**
 * Union of all `TriggeredAction` types.
 */
export type TriggeredAction
	= PlayAnimationTriggeredAction
	| StopAnimationTriggeredAction
	| PlaySoundTriggeredAction
	;
