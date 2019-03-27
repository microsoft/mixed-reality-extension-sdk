/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
export interface InternalPatchable<T> {
    observing: boolean;
    patch: T;
    getPatchAndReset(): T;
}

/**
 * @hidden
 */
export interface Patchable<T> {
    internal: InternalPatchable<T>;
    toJSON(): T;
    copy(from: Partial<T>): this;
    // static sanitize(arg: Partial<T>): any
}
