/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * ForwardPromise is a promise that makes the result value immediately available. ForwardPromise is returned where
 * it is safe to access the result before it has been fully initialized remotely. You can choose to wait on this
 * promise if you need to know when the resource has been fully created on the host.
 */
export class ForwardPromise<T> extends Promise<T> {
    /**
     * Returns the result value of this ForwardPromise.
     */
    public get value() { return this._value; }

    /**
     * Constructs a new instance of a ForwardPromise.
     * @param _value The result value of the promise.
     * @param executor Promise execution handler.
     */
    constructor(
        // tslint:disable-next-line:variable-name
        private _value: T,
        executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
        super(executor);
    }

    /**
     * Returns a new resolved ForwardPromise.
     * @param value The result value of the promise.
     */
    public static Resolve<U>(value: U) {
        return new ForwardPromise<U>(value, (resolve, $) => resolve(value));
    }

    /**
     * Returns a new rejected ForwardPromise.
     * @param reason The reason for the rejection.
     */
    public static Reject<U>(reason?: any) {
        return new ForwardPromise<U>(undefined, ($, reject) => reject(reason));
    }
}

// Promise is a native type and not friendly to subclassing, so this hack necessary to set up the inheritance chain.
ForwardPromise.prototype.constructor = Promise;
