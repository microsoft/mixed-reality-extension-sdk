/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExportedPromise } from '../internal';

/** @hidden */
export interface QueuedPromise {
	promise: ExportedPromise;
	timeout: NodeJS.Timer;
}
