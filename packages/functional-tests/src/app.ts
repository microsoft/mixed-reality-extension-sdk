/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as MRERPC from '@microsoft/mixed-reality-extension-sdk/built/rpc';

import Menu from './menu';
import { Test, TestFactory } from './test';
import { Factories } from './tests';
import destroyActors from './utils/destroyActors';

export const SuccessColor = MRE.Color3.Green();
export const FailureColor = MRE.Color3.Red();
export const NeutralColor = MRE.Color3.Yellow();
export const BackgroundColor = new MRE.Color3(0.25, 0.25, 0.25);

/**
 * Functional Test Application. Takes query arguments to the websocket connection
 * @param test - Initialize menu on a particular test
 * @param autostart - Start the test immediately on user join
 * @param nomenu - Do not spawn the controls
 */
export class App {
    private _rpc: MRERPC.ContextRPC;
    private firstUser: MRE.User;
    private _connectedUsers: { [id: string]: MRE.User } = {};
    public testResults: { [name: string]: boolean } = {};

    private activeTestName: string;
    private activeTestFactory: TestFactory;
    private activeTest: Test = null;
    private runPromise: Promise<void> = null;

    private contextLabel: MRE.Actor;
    private playPauseButton: MRE.Actor;
    private playPauseText: MRE.Actor;
    private runnerActors: MRE.Actor[];
    private backgroundMaterial: MRE.Material;

    private readonly menu = new Menu(this);

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }
    public get connectedUsers() { return this._connectedUsers; }

    constructor(private _context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.context.onStarted(() => {
            if (this.params.test === undefined) {
                this.menu.show();
            } else {
                this.activeTestName = this.params.test as string;
                this.activeTestFactory = Factories[this.activeTestName];
                this.setupRunner();
            }
        });
        this.context.onUserJoined((user) => this.userJoined(user));
        this.context.onUserLeft((user) => this.userLeft(user));
        this.backgroundMaterial = this.context.assetManager.createMaterial('background',
            {
                color: BackgroundColor
            }).value;

        this.menu.onSelection((name, factory, userId) => {
            this.menu.hide();
            this.activeTestName = name;
            this.activeTestFactory = factory;
            this.runTest(this.context.user(userId));
        });
    }

    private userJoined(user: MRE.User) {
        this.connectedUsers[user.id] = user;
        if (!this.firstUser) {
            this.firstUser = user;
            if (this.params.autorun !== undefined) {
                this.runTest(user);
            }
        }
    }

    private userLeft(user: MRE.User) {
        delete this.connectedUsers[user.id];
        if (user === this.firstUser) {
            this.firstUser = this.context.users[0] || null;
            if (!this.firstUser) {
                this.stopTest().catch(() => { });
            }
        }
    }

    private runTest(user: MRE.User) {
        // finish setting up runner
        if (!this.contextLabel) {
            this.setupRunner();
        }

        // halt the previous test if there is one
        (this.activeTest !== null ? this.stopTest() : Promise.resolve())
            // start the new test, and save the stop handle
            .then(() => {
                if (this.playPauseButton) {
                    this.playPauseButton.material.color.set(1, 0, 0, 1);
                    this.playPauseText.text.contents = "Stop";
                }
                return this.runPromise = this.runTestHelper(user);
            })
            .then(() => {
                if (this.playPauseButton) {
                    this.playPauseButton.material.color.set(0, 1, 0, 1);
                    this.playPauseText.text.contents = "Start";
                }
            })
            // and log unexpected errors
            .catch(err => console.log(err));
    }

    private async runTestHelper(user: MRE.User) {
        this.rpc.send('functional-test:test-starting', this.activeTestName);
        console.log(`Test starting: '${this.activeTestName}'`);

        const test = this.activeTest = this.activeTestFactory(this, this.baseUrl, user);
        this.setOverrideText(test.expectedResultDescription);

        this.rpc.send('functional-test:test-started', this.activeTestName);
        console.log(`Test started: '${this.activeTestName}'`);

        let success: boolean;
        try {
            success = await test.run();
            if (!success) {
                this.setOverrideText("Test Failed: '${testName}'", FailureColor);
            }
        } catch (e) {
            console.log(e);
            this.setOverrideText("Test " + e, FailureColor);
            success = false;
        }

        console.log(`Test complete: '${this.activeTestName}'. Success: ${success}`);
        this.rpc.send('functional-test:test-complete', this.activeTestName, success);
        this.testResults[this.activeTestName] = success;
        if (success) {
            this.setOverrideText(null);
        }

        test.cleanup();

        // Delete all actors
        destroyActors(this.context.rootActors.filter(x => !this.runnerActors.includes(x)));
        this.context.assetManager.cleanup();
    }

    private async stopTest() {
        if (this.activeTest !== null) {
            this.activeTest.stop();
            await this.runPromise;
            this.activeTest = null;
            this.runPromise = null;
        }
    }

    public setOverrideText(text: string, color: MRE.Color3 = NeutralColor): void {
        if (text) {
            this.contextLabel.text.color = color;
            this.contextLabel.text.contents = text;
        } else {
            if (this.testResults[this.activeTestName] === true) {
                this.contextLabel.text.color = SuccessColor;
            } else if (this.testResults[this.activeTestName] === false) {
                this.contextLabel.text.color = FailureColor;
            } else {
                this.contextLabel.text.color = NeutralColor;
            }
            this.contextLabel.text.contents = this.activeTest.expectedResultDescription;
        }
    }

    private setupRunner() {
        // Main label at the top of the stage
        this.contextLabel = MRE.Actor.CreateEmpty(this.context, {
            actor: {
                name: 'contextLabel',
                text: {
                    contents: this.activeTestName,
                    height: 0.2,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: NeutralColor
                },
                transform: {
                    position: { y: 1.8 }
                }
            }
        }).value;

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
                    position: { x: -0.65, y: 0.15, z: -1.95 }
                }
            }
        }).value;

        this.playPauseText = MRE.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: this.playPauseButton.id,
                transform: {
                    position: { z: -0.1 }
                },
                text: {
                    contents: "Start",
                    height: 0.15,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: NeutralColor
                }
            }
        }).value;

        this.playPauseButton.setBehavior(MRE.ButtonBehavior)
            .onClick("released", userId => {
                if (this.activeTest === null) {
                    this.runTest(this.context.user(userId));
                } else {
                    this.stopTest().catch(() => { });
                }
            });

        const menuButton = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.7, y: 0.3, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'menu',
                transform: {
                    position: { x: 0.65, y: 0.15, z: -1.95 }
                }
            }
        }).value;

        const menuText = MRE.Actor.CreateEmpty(this.context, {
            actor: {
                parentId: menuButton.id,
                transform: {
                    position: { z: -0.1 }
                },
                text: {
                    contents: "Return",
                    height: 0.15,
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: MRE.Color3.Black()
                }
            }
        }).value;

        menuButton.setBehavior(MRE.ButtonBehavior)
            .onClick("released", async userId => {
                await this.stopTest();
                [this.contextLabel, this.playPauseButton, this.playPauseText]
                    = this.runnerActors
                    = destroyActors(this.runnerActors);

                this.menu.show();
            });

        const floor = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 2, y: 0.1, z: 2.1 }
            },
            addCollider: true,
            actor: {
                name: 'floor',
                transform: {
                    position: { x: 0, y: -0.05, z: -1 }
                },
            }
        }).value;
        floor.material = this.backgroundMaterial;

        const wall = MRE.Actor.CreatePrimitive(this.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 2, y: 2, z: 0.1 }
            },
            addCollider: true,
            actor: {
                name: 'floor',
                transform: {
                    position: { x: 0, y: 1, z: 0.1 }
                }
            }
        }).value;
        wall.material = this.backgroundMaterial;

        this.runnerActors =
            [this.contextLabel, this.playPauseButton, this.playPauseText, menuButton, menuText, wall, floor];
    }
}
