/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ActorLike } from '..';

export interface AnimationKeyframe {
	value: Partial<ActorLike>;
	time: number;
}
