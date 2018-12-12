/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * ForwardPromise is a promise that makes the result value immediately available. ForwardPromise is returned where
 * it is safe to access the result before it has been fully initialized remotely. You can choose to wait on this
 * promise if you need to know when the resource has been fully created on the host.
 */
export interface ForwardPromise<T> extends Promise<T> {
    value?: T;
}

/**
 * Creates a new ForwardPromise from a literal value and a regular promise.
 * @param value An early-resolved value of the promise.
 * @param promise The promise to be converted.
 */
export function createForwardPromise<T>(
    value: T,
    promise: Promise<T>
): ForwardPromise<T> {
    const fp = promise as ForwardPromise<T>;
    fp.value = value;
    return fp;
}
