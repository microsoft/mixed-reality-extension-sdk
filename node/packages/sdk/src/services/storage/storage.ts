/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Interface for storage a provider that reads and writes plain old JSON objects.
 */
export interface Storage {
    /**
     * Retrieves storage items.
     * @param keys Array of item keys to retrieve from the store.
     */
    read(keys: string[]): Promise<StorageItems>;

    /**
     * Saves storage items.
     * @param changes Map of items to write to the store.
     */
    write(changes: StorageItems): Promise<void>;

    /**
     * Removes storage items.
     * @param keys Array of item keys to remove from the store.
     */
    delete(keys: string[]): Promise<void>;
}

/**
 * Object which is stored and an optional flag.
 */
export interface StorageItems {
    /**
     * Storage items indexed by key.
     */
    [key: string]: StorageItem;
}

export interface StorageItem {
    /**
     * Key/value pairs.
     */
    [key: string]: any;
    /**
     * (Optional) eTag field for stores that support optimistic concurrency.
     */
    eTag?: string;
}
