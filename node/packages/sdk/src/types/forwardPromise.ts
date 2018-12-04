/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ForwardPromise<T> extends Promise<T> {
    value?: T;
}

export function createForwardPromise<T>(
    value: T,
    promise: Promise<T>
): ForwardPromise<T> {
    const fp = promise as ForwardPromise<T>;
    fp.value = value;
    return fp;
}
