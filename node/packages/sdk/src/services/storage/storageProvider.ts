/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from '.';

export interface StorageProvider {
    getStorage(sessionId: string): Storage;
}
