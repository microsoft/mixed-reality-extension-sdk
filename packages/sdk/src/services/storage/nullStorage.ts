/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage, StorageItems } from '.';

/**
 * A storage object that stores nothing.
 */
export class NullStorage implements Storage {
    public read(keys: string[]): Promise<StorageItems> {
        return Promise.resolve({});
    }
    public write(changes: StorageItems): Promise<void> {
        return Promise.resolve();
    }
    public delete(keys: string[]): Promise<void> {
        return Promise.resolve();
    }
}
