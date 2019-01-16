/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import * as MRERPC from '@microsoft/mixed-reality-extension-sdk/built/rpc';
import AssetPreloadTest from './tests/asset-preload-test';
import ClockSyncTest from './tests/clock-sync-test';
import GltfAnimationTest from './tests/gltf-animation-test';
import GltfConcurrencyTest from './tests/gltf-concurrency-test';
import GltfGenTest from './tests/gltf-gen-test';
import InputTest from './tests/input-test';
import LibraryTest from './tests/library-test';
import LookAtTest from './tests/look-at-test';
import PrimitivesTest from './tests/primitives-test';
import RigidBodyTest from './tests/rigid-body-test';
import RootMotionTest from './tests/root-motion-test';
import Test from './tests/test';
import TextTest from './tests/text-test';
import UserTest from './tests/user-test';
import delay from './utils/delay';
import destroyActors from './utils/destroyActors';

/**
 * Functional Test Application.
 */
export default class App {
    private activeTests: { [id: string]: Test } = {};
    private _rpc: MRERPC.ContextRPC;
    private firstUser: MRESDK.User;
    private _connectedUsers: { [id: string]: MRESDK.User } = {};

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }
    public get connectedUsers() { return this._connectedUsers; }

    /**
     * Registry of functional tests. Add your test here.
     */
    private testFactories: { [key: string]: (user: MRESDK.User) => Test } = {
        'asset-preload-test': (user: MRESDK.User): Test => new AssetPreloadTest(this, this.baseUrl, user),
        'clock-sync-test': (): Test => new ClockSyncTest(this, this.baseUrl),
        'gltf-animation-test': (): Test => new GltfAnimationTest(this, this.baseUrl),
        'gltf-concurrency-test': (): Test => new GltfConcurrencyTest(this, this.baseUrl),
        'gltf-gen-test': (): Test => new GltfGenTest(this, this.baseUrl),
        'input-test': (): Test => new InputTest(this, this.baseUrl),
        'library-test': (): Test => new LibraryTest(this, this.baseUrl),
        'look-at-test': (user: MRESDK.User): Test => new LookAtTest(this, this.baseUrl, user),
        'primitives-test': (): Test => new PrimitivesTest(this, this.baseUrl),
        'rigid-body-test': (): Test => new RigidBodyTest(this),
        'root-motion-test': (): Test => new RootMotionTest(this, this.baseUrl),
        'text-test': (): Test => new TextTest(this),
        'user-test': (user: MRESDK.User): Test => new UserTest(this, this.baseUrl, user),
    };

    constructor(private _context: MRESDK.Context, private params: MRESDK.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.userJoined = this.userJoined.bind(this);
        this.userLeft = this.userLeft.bind(this);

        this.context.onUserJoined(this.userJoined);
        this.context.onUserLeft(this.userLeft);
    }

    private userJoined = async (user: MRESDK.User) => {
        console.log(`user-joined: ${user.name}, ${user.id}, ${user.properties.remoteAddress}`);
        this._connectedUsers[user.id] = user;

        let testName: string;
        if (Array.isArray(this.params.test) && this.params.test.length > 0) {
            testName = this.params.test[0];
        } else {
            testName = this.params.test as string;
        }
        if (testName) {
            await this.startTest(testName, user);
            this.rpc.send('functional-test:close-connection');
        } else {
            if (!this.firstUser) {
                const promise = this.runFunctionalTestMenu();
            }
            this.firstUser = user;
        }
    }
    private userLeft = (user: MRESDK.User) => {
        console.log(`user-left: ${user.name}, ${user.id}`);
        delete this._connectedUsers[user.id];
    }
    private async startTest(testName: string, user: MRESDK.User) {
        if (this.activeTests[testName]) {
            console.log(`Test already running: '${testName}'`);
        } else if (!this.testFactories[testName]) {
            console.log(`error: Unrecognized test: '${testName}'`);
        } else {
            const test = this.activeTests[testName] = this.testFactories[testName](user);
            this.rpc.send('functional-test:test-started', testName);
            console.log(`Test started: '${testName}'`);
            let success: boolean;
            try {
                success = await test.run();
            } catch (e) {
                console.log(e);
                success = false;
            }
            console.log(`Test complete: '${testName}'. Success: ${success}`);
            this.rpc.send('functional-test:test-complete', testName, success);

            delete this.activeTests[testName];
        }
    }
    private async displayFunctionalTestChoices(rootActor: MRESDK.ActorLike): Promise<string> {
        return new Promise<string>((resolve) => {
            let y = 0;
            for (const key in this.testFactories) {
                if (this.testFactories.hasOwnProperty(key)) {
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
                    buttonBehavior.onClick('pressed', (userId: string) => {
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
            }
        });
    }

    private async runFunctionalTestMenu() {
        while (true) {
            const rootActor = MRESDK.Actor.CreateEmpty(this.context, {});
            const selectedTestName = await this.displayFunctionalTestChoices(rootActor.value);
            destroyActors(rootActor.value);
            await this.startTest(selectedTestName, this.firstUser);
        }
    }
}
