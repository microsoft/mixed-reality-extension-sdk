/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Actor, User } from '@microsoft/mixed-reality-extension-sdk';

import { App } from './app';

export type TestFactory = (app: App, baseUrl: string, user: User) => Test;

/**
 * The super-class of all functional tests
 */
export abstract class Test {

	/**
	 * A human-readable description of what should be happening.
	 * Will be displayed as part of the app.
	 */
	public expectedResultDescription: string;

	protected modsOnly = false;

	private _stopped = false;
	private stoppedPromise: Promise<void> = null;
	private stoppedContinue: () => void = null;

	constructor(protected app: App, protected baseUrl: string, protected user: User) { }

	/**
	 * Main test entry point. This should run indefinitely until [[stop]] is called.
	 */
	public abstract run(root: Actor): Promise<boolean>;

	/**
	 * If the test requires anything other than actor cleanup, do it here.
	 */
	public cleanup(): void { }

	/**
	 * Called by the test runner to end the test. Tests should not override this
	 * directly, but instead either check the stopped variable, or await stoppedAsync().
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
	public get stopped() { return this._stopped; }

	/**
	 * Asynchronous test for when a test should stop
	 */
	public stoppedAsync() {
		return this.stoppedPromise = this.stoppedPromise ||
			new Promise<void>(resolve => {
				if (this._stopped) {
					resolve();
				} else {
					this.stoppedContinue = resolve;
				}
			});
	}

	public checkPermission(user: User) {
		if (this.modsOnly) {
			if (!/moderator|presenter/u.test(user.properties['altspacevr-roles'])) {
				throw new Error('Only moderators can run this test');
			} else {
				console.log(`User ${user.name} allowed to start test`);
			}
		}
	}
}
