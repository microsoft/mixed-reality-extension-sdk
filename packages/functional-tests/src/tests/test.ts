/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import App from '../app';

/**
 * The super-class of all functional tests
 */
export default abstract class Test {

    /**
     * A human-readable description of what should be happening.
     * Will be displayed as part of the app.
     */
    public expectedResultDescription: string;

    constructor(protected app: App) { }

    /**
     * Main test entry point. This should run indefinitely until [[stop]] is called.
     */
    public abstract run(): Promise<boolean>;

    /**
     * If the test requires anything other than actor cleanup, do it here.
     */
    public cleanup(): void { }


    private stoppedContinue: () => void = null;

    /**
     * Called by the test runner to end the test. Tests should not override this
     * directly, but instead either check the _stopped variable, or await stopped().
     */
    public stop(): void {
        this._stopped = true;
        if (this.stoppedContinue) {
            this.stoppedContinue();
            this.stoppedContinue = null;
        }
    }

    /**
     * Synchronous test for when a test should stop
     */
    protected _stopped = false;

    /**
     * Asynchronous test for when a test should stop
     */
    protected stopped(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this._stopped) {
                resolve();
            } else {
                this.stoppedContinue = resolve;
            }
        });
    }
}
