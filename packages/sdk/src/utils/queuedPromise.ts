/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ExportedPromise } from './exportedPromise';

/** @hidden */
export interface QueuedPromise {
    promise: ExportedPromise;
    timestamp: number;
}
