/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import * as MRERPC from '@microsoft/mixed-reality-extension-sdk/built/rpc';

import { Test } from './test';
import Factories from './tests';

import delay from './utils/delay';
import destroyActors from './utils/destroyActors';

/**
 * Functional Test Application.
 */
export default class App {
    private _rpc: MRERPC.ContextRPC;
    private firstUser: MRESDK.User;
    private _connectedUsers: { [id: string]: MRESDK.User } = {};
    private testNames = Object.keys(Factories).sort();
    private activeTestName: string;
    private activeTest: Test = null;

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }
    public get connectedUsers() { return this._connectedUsers; }

    constructor(private _context: MRESDK.Context, private params: MRESDK.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.context.onStarted(() => this.presentMenu());
        this.context.onUserJoined((user) => this.userJoined(user));
        this.context.onUserLeft((user) => this.userLeft(user));
    }

    private async presentMenu() {
        this.activeTestName = this.params.test as string;
    }

    private async userJoined(user: MRESDK.User) {
        console.log(`user-joined: ${user.name}, ${user.id}, ${user.properties.remoteAddress}`);
        this._connectedUsers[user.id] = user;

        let testName: string;
        if (Array.isArray(this.params.test) && this.params.test.length > 0) {
            testName = this.params.test[0];
        } else {
            testName = this.params.test as string;
        }
        if (testName) {
            await this.runTest(testName, user);
            this.rpc.send('functional-test:close-connection');
        } else {
            if (!this.firstUser) {
                const promise = this.runFunctionalTestMenu();
            }
            this.firstUser = user;
        }
    }

    private userLeft(user: MRESDK.User) {
        console.log(`user-left: ${user.name}, ${user.id}`);
        delete this._connectedUsers[user.id];
    }

    private async runTest(testName: string, user: MRESDK.User) {
        if (!Factories[testName]) {
            console.log(`error: Unrecognized test: '${testName}'`);
        } else {
            this.rpc.send('functional-test:test-starting', testName);
            console.log(`Test starting: '${testName}'`);
            const test = this.activeTest = Factories[testName](this, this.baseUrl, user);
            this.rpc.send('functional-test:test-started', testName);
            console.log(`Test started: '${testName}'`);

            let success: boolean;
            try {
                success = await test.run();
                if (!success) {
                    await this.displayError("Test Failed: '${testName}'");
                }
            } catch (e) {
                console.log(e);
                await this.displayError("Test Triggered Exception: " + e);
                success = false;
            }
            console.log(`Test complete: '${testName}'. Success: ${success}`);
            this.rpc.send('functional-test:test-complete', testName, success);

            test.cleanup();

            // Delete all actors
            destroyActors(this.context.rootActors);
            this.context.assetManager.cleanup();
        }
    }

    private async displayError(errorString: string) {
        const errorLabel = await MRESDK.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'label',
                text: {
                    contents: errorString,
                    height: 0.5,
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter
                },
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await delay(2000);
        destroyActors(errorLabel);
    }

    private async displayFunctionalTestChoices(rootActor: MRESDK.ActorLike): Promise<string> {
        return new Promise<string>((resolve) => {
            let y = 0.3;
            for (const key of Object.keys(Factories).sort().reverse()) {
                const button = MRESDK.Actor.CreatePrimitive(this.context, {
                    definition: {
                        shape: MRESDK.PrimitiveShape.Box,
                        dimensions: { x: 0.3, y: 0.3, z: 0.01 }
                    },
                    addCollider: true,
                    actor: {
                        name: key,
                        parentId: rootActor.id,
                        transform: {
                            position: { x: 0, y, z: 0 }
                        }
                    }
                });

                const buttonBehavior = button.value.setBehavior(MRESDK.ButtonBehavior);
                buttonBehavior.onClick('released', (userId: string) => {
                    resolve(button.value.name);
                });

                MRESDK.Actor.CreateEmpty(this.context, {
                    actor: {
                        name: 'label',
                        parentId: rootActor.id,
                        text: {
                            contents: key,
                            height: 0.5,
                            anchor: MRESDK.TextAnchorLocation.MiddleLeft
                        },
                        transform: {
                            position: { x: 0.5, y, z: 0 }
                        }
                    }
                });
                y = y + 0.5;
            }
        });
    }

    private async runFunctionalTestMenu() {
        while (true) {
            const rootActor = MRESDK.Actor.CreateEmpty(this.context, {});
            const selectedTestName = await this.displayFunctionalTestChoices(rootActor.value);
            destroyActors(rootActor.value);
            await this.runTest(selectedTestName, this.firstUser);
        }
    }
}
