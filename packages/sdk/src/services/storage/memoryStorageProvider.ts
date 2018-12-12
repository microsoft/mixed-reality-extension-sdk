/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MemoryStorage, Storage, StorageProvider } from '.';

/**
 * A storage provider that stores data in local memory.
 */
export class MemoryStorageProvider implements StorageProvider {
    private sessions: { [sessionId: string]: MemoryStorage; } = {};

    public getStorage(sessionId: string): Storage {
        this.sessions[sessionId] = this.sessions[sessionId] || new MemoryStorage();
        return this.sessions[sessionId];
    }
}
