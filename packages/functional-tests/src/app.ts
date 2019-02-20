/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as MRERPC from '@microsoft/mixed-reality-extension-sdk/built/rpc';

import { Test } from './test';
import Factories from './tests';
import destroyActors from './utils/destroyActors';

const SuccessColor = MRE.Color3.Green();
const FailureColor = MRE.Color3.Red();
const NeutralColor = MRE.Color3.Yellow();

/**
 * Functional Test Application. Takes query arguments to the websocket connection
 * @param test - Initialize menu on a particular test
 * @param autostart - Start the test immediately on user join
 * @param nomenu - Do not spawn the controls
 */
export default class App {
    private _rpc: MRERPC.ContextRPC;
    private firstUser: MRE.User;
    private _connectedUsers: { [id: string]: MRE.User } = {};
    private testNames = Object.keys(Factories).sort();
    private testResults: { [name: string]: boolean } = {};

    private activeTest: Test = null;

    private contextLabel: MRE.Actor;
    private playPauseButton: MRE.Actor;
    private menuActors: MRE.Actor[];

    private setupPromise: Promise<void>;
    private runPromise: Promise<void> = null;

    private _activeTestName: string;
    private get activeTestName() { return this._activeTestName; }
    private set activeTestName(val) {
        if (this.activeTest === null) {
            this._activeTestName = val;
            this.setOverrideText(null);
        } else {
            this.stopTest().catch(() => {});
        }
    }

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }
    public get connectedUsers() { return this._connectedUsers; }

    constructor(private _context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.context.onStarted(() => this.setupPromise = this.setupMenu());
        this.context.onUserJoined((user) => this.userJoined(user));
        this.context.onUserLeft((user) => this.userLeft(user));
    }

    private userJoined(user: MRE.User) {
        if (!this.firstUser) {
            this.firstUser = user;
            if (this.params.autorun !== undefined) {
                this.runTest(user);
            }
        }
    }

    private userLeft(user: MRE.User) {
        if (user === this.firstUser) {
            this.firstUser = this.context.users[0] || null;
            if (!this.firstUser) {
                this.stopTest().catch(() => {});
            }
        }
    }

    private runTest(user: MRE.User) {
        // finish setting up menu
        this.setupPromise
        // halt the previous test if there is one
        .then(() => this.activeTest !== null ? this.stopTest() : Promise.resolve())
        // start the new test, and save the stop handle
        .then(() => this.runPromise = this.runTestHelper(user))
        // and log unexpected errors
        .catch(err => console.log(err));
    }

    private async runTestHelper(user: MRE.User) {
        this.playPauseButton.material.color.set(1, 0, 0, 1);
        this.rpc.send('functional-test:test-starting', this.activeTestName);
        console.log(`Test starting: '${this.activeTestName}'`);

        const test = this.activeTest = Factories[this.activeTestName](this, this.baseUrl, user);
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
            this.setOverrideText("Test Triggered Exception: " + e, FailureColor);
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
        destroyActors(this.context.rootActors.filter(x => !this.menuActors.includes(x)));
        this.context.assetManager.cleanup();
    }

    private async stopTest() {
        this.playPauseButton.material.color.set(0, 1, 0, 1);
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
            this.contextLabel.text.contents = this.activeTestName;
        }
    }

    private async setupMenu() {
        this._activeTestName = this.params.test as string || this.testNames[0];

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
                    position: { y: 1 },
                    rotation: { x: 0, y: 1, z: 0, w: 0 } // 180 turn
                }
            }
        }).value;

        if (this.params.nomenu) {
            return;
        }

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
            .onClick("released", () => {
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
            .onClick("released", () => {
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
                if (this.activeTest === null) {
                    this.runTest(this.context.user(userId));
                } else {
                    this.stopTest().catch(() => {});
                }
            });

        this.menuActors = [this.contextLabel, next, prev, this.playPauseButton];
    }
}
