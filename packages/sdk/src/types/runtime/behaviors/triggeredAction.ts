/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SetAudioStateOptions } from '../../..';

export type PlayAnimationTriggeredAction = {
	type: 'play-animation',
	animationName: string
};

export type PlaySoundTriggeredAction = {
	type: 'play-sound',
	assetId: string,
	options?: SetAudioStateOptions
};

export type TriggeredAction
	= PlayAnimationTriggeredAction
	| PlaySoundTriggeredAction
	;
