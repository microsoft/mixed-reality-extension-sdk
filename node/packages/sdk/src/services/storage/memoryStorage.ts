/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage, StorageItem, StorageItems } from '.';

/**
 * Memory based storage provider.
 */
export class MemoryStorage implements Storage {
    private eTag: number;
    private memory: { [key: string]: string; } = {};

    constructor() {
        this.eTag = 1;
    }

    public read(keys: string[]): Promise<StorageItems> {
        return new Promise<StorageItems>((resolve, reject) => {
            const data: StorageItems = {};
            keys.forEach((key) => {
                const item = this.memory[key];
                if (item) {
                    data[key] = JSON.parse(item);
                }
            });
            resolve(data);
        });
    }

    public write(changes: StorageItems): Promise<void> {
        const that = this;
        function saveItem(key: string, item: StorageItem) {
            const clone = Object.assign({}, item);
            clone.eTag = (that.eTag++).toString();
            that.memory[key] = JSON.stringify(clone);
        }

        return new Promise<void>((resolve, reject) => {
            for (const key in changes) {
                if (!changes.hasOwnProperty(key)) {
                    continue;
                }
                const newItem = changes[key];
                const old = this.memory[key];
                if (!old || newItem.eTag === '*') {
                    saveItem(key, newItem);
                } else {
                    const oldItem: StorageItem = JSON.parse(old);
                    if (newItem.eTag === oldItem.eTag) {
                        saveItem(key, newItem);
                    } else {
                        reject(new Error(`Storage: error writing "${key}" due to eTag conflict.`));
                    }
                }
            }
            resolve();
        });
    }

    public delete(keys: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            keys.forEach((key) => delete this.memory[key]);
            resolve();
        });
    }
}
