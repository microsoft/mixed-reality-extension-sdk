/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
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
    private firstUser: MRE.User;
    private _connectedUsers: { [id: string]: MRE.User } = {};
    private testNames = Object.keys(Factories).sort();
    private _activeTestName: string;
    private activeTest: Test = null;

    private contextLabel: MRE.Actor;
    private playPauseButton: MRE.Actor;

    private get activeTestName() { return this._activeTestName; }
    private set activeTestName(val) {
        if (this.activeTest !== null) {
            this.stopTest();
        }

        this._activeTestName = val;
        this.contextLabel.text.contents = val;
    }

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }
    public get connectedUsers() { return this._connectedUsers; }

    constructor(private _context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.context.onStarted(() => this.setupMenu());
        //this.context.onUserJoined((user) => this.userJoined(user));
        //this.context.onUserLeft((user) => this.userLeft(user));
    }

    private async setupMenu() {
        this._activeTestName = this.params.test as string || this.testNames[0];

        // Main label at the top of the stage
        this.contextLabel = MRE.Actor.CreateEmpty(this.context, { actor: {
            name: 'contextLabel',
            text: {
                contents: this.activeTestName,
                height: 0.2,
                anchor: MRE.TextAnchorLocation.MiddleCenter,
                justify: MRE.TextJustify.Center
            },
            transform: {
                position: { y: 1 },
                rotation: { x: 0, y: 1, z: 0, w: 0 } // 180 turn
            }
        }}).value;

        // Back up to the previous test
        const prev = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.3, y: 0.7, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'prev',
                transform: {
                    position: { x: -1.5 }
                }
            }
        }).value;

        prev.setBehavior(MRE.ButtonBehavior)
            .onClick("released", userId => {
                const oldIndex = this.testNames.indexOf(this.activeTestName);
                const newIndex = (this.testNames.length + oldIndex - 1) % this.testNames.length;
                this.activeTestName = this.testNames[newIndex];
            });

        // Advance to the next test
        const next = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.3, y: 0.7, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'next',
                transform: {
                    position: { x: 1.5 }
                }
            }
        }).value;

        next.setBehavior(MRE.ButtonBehavior)
            .onClick("released", userId => {
                const oldIndex = this.testNames.indexOf(this.activeTestName);
                const newIndex = (this.testNames.length + oldIndex + 1) % this.testNames.length;
                this.activeTestName = this.testNames[newIndex];
            });
        
        // start or stop the active test
        const ppMat = this.context.assetManager.createMaterial('pp', {
            color: MRE.Color3.Green().toJSON()
        }).value;

        this.playPauseButton = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.7, y: 0.3, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'playpause',
                materialId: ppMat.id,
                transform: {
                    position: { y: -1 }
                }
            }
        }).value;

        this.playPauseButton.setBehavior(MRE.ButtonBehavior)
            .onClick("released", userId => {
                if(this.activeTest === null) {
                    this.runTest(this.context.user(userId))
                } else {
                    this.stopTest();
                }
            });
    }

    private async runTest(user: MRE.User = null) {
        if (this.activeTest !== null) {
            await this.stopTest();
        }

        this.playPauseButton.material.color.set(1, 0, 0, 1);
    }

    private async stopTest() {
        this.playPauseButton.material.color.set(0, 1, 0, 1);
    }

    /*private async userJoined(user: MRE.User) {
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

    private userLeft(user: MRE.User) {
        console.log(`user-left: ${user.name}, ${user.id}`);
        delete this._connectedUsers[user.id];
    }

    private async runTest(testName: string, user: MRE.User) {
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
        const errorLabel = await MRE.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'label',
                text: {
                    contents: errorString,
                    height: 0.5,
                    anchor: MRE.TextAnchorLocation.MiddleCenter
                },
                transform: {
                    position: { x: 0, y: 0, z: 0 }
                }
            }
        });
        await delay(2000);
        destroyActors(errorLabel);
    }

    private async displayFunctionalTestChoices(rootActor: MRE.ActorLike): Promise<string> {
        return new Promise<string>((resolve) => {
            let y = 0.3;
            for (const key of Object.keys(Factories).sort().reverse()) {
                const button = MRE.Actor.CreatePrimitive(this.context, {
                    definition: {
                        shape: MRE.PrimitiveShape.Box,
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

                const buttonBehavior = button.value.setBehavior(MRE.ButtonBehavior);
                buttonBehavior.onClick('released', (userId: string) => {
                    resolve(button.value.name);
                });

                MRE.Actor.CreateEmpty(this.context, {
                    actor: {
                        name: 'label',
                        parentId: rootActor.id,
                        text: {
                            contents: key,
                            height: 0.5,
                            anchor: MRE.TextAnchorLocation.MiddleLeft
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
            const rootActor = MRE.Actor.CreateEmpty(this.context, {});
            const selectedTestName = await this.displayFunctionalTestChoices(rootActor.value);
            destroyActors(rootActor.value);
            await this.runTest(selectedTestName, this.firstUser);
        }
    }*/
}
