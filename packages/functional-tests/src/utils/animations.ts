/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export const LeftRightSwing: MRE.AnimationKeyframe[] = [
	{ time: 0, value: { transform: { local: { position: { x: 0.25 } } } } },
	{ time: 0.5, value: { transform: { local: { position: { x: -0.25 } } } } },
	{ time: 1, value: { transform: { local: { position: { x: 0.25 } } } } }
];
