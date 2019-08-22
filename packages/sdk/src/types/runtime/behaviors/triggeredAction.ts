/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SetAudioStateOptions } from '../../..';

/**
 * Plays an animation in response to the associated event. Animation plays on the actor specified by `targetId`.
 * If `targetId` is not given, the animation plays on the actor associated with the event that fired.
 */
export type PlayAnimationTriggeredAction = {
	type: 'play-animation',
	// TODO: Fill in all doc strings
	animationName: string,
	targetId?: string
};

/**
 * Plays a sound in response to the associated event. The sound plays on the actor specified by `targetId`.
 * If `targetId` is not given, the sound plays on the actor associated with the event that fired.
 */
export type PlaySoundTriggeredAction = {
	type: 'play-sound',
	assetId: string,
	targetId?: string,
	options?: SetAudioStateOptions
};

/**
 * Union of all `TriggeredAction` types.
 */
export type TriggeredAction
	= PlayAnimationTriggeredAction
	| PlaySoundTriggeredAction
	;
