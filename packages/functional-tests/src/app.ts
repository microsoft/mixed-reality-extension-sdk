/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import * as MRERPC from '@microsoft/mixed-reality-extension-sdk/built/rpc';
import AssetPreloadTest from './tests/asset-preload';
import ClockSyncTest from './tests/clock-sync-test';
import GltfAnimationTest from './tests/gltf-animation-test';
import InputTest from './tests/input-test';
import LookAtTest from './tests/look-at-test';
import PrimitivesTest from './tests/primitives-test';
import RigidBodyTest from './tests/rigid-body-test';
import Test from './tests/test';
import TextTest from './tests/text-test';

/**
 * Functional Test Application.
 */
export default class App {
    private activeTests: { [id: string]: Test } = {};
    private _rpc: MRERPC.ContextRPC;

    public get context() { return this._context; }
    public get rpc() { return this._rpc; }

    /**
     * Registry of functional tests. Add your test here.
     */
    private testFactories: { [key: string]: () => Test } = {
        'gltf-animation-test': (): Test => new GltfAnimationTest(this, this.baseUrl),
        'look-at-test': (): Test => new LookAtTest(this, this.baseUrl),
        'rigid-body-test': (): Test => new RigidBodyTest(this),
        'text-test': (): Test => new TextTest(this),
        'clock-sync-test': (): Test => new ClockSyncTest(this, this.baseUrl),
        'primitives-test': (): Test => new PrimitivesTest(this, this.baseUrl),
        'input-test': (): Test => new InputTest(this, this.baseUrl),
        'asset-preload': (): Test => new AssetPreloadTest(this, this.baseUrl)
    };

    constructor(private _context: MRESDK.Context, private params: MRESDK.ParameterSet, private baseUrl: string) {
        this._rpc = new MRERPC.ContextRPC(_context);

        this.userJoined = this.userJoined.bind(this);
        this.userLeft = this.userLeft.bind(this);

        this.context.onUserJoined(this.userJoined);
        this.context.onUserLeft(this.userLeft);
    }

    private userJoined = async (user: MRESDK.User) => {
        console.log(`user-joined: ${user.name}, ${user.id}`);

        let testName: string;
        if (Array.isArray(this.params.test) && this.params.test.length > 0) {
            testName = this.params.test[0];
        } else {
            testName = this.params.test as string;
        }

        await this.startTest(testName);
    }

    private userLeft = (user: MRESDK.User) => {
        console.log(`user-left: ${user.name}, ${user.id}`);
    }

    private async startTest(testName: string) {
        if (this.activeTests[testName]) {
            console.log(`Test already running: '${testName}'`);
        } else if (!this.testFactories[testName]) {
            console.log(`error: Unrecognized test: '${testName}'`);
        } else {
            const test = this.activeTests[testName] = this.testFactories[testName]();
            this.rpc.send('functional-test:test-started', testName);
            console.log(`Test started: '${testName}'`);
            const success = await test.run();
            console.log(`Test complete: '${testName}'. Success: ${success}`);
            this.rpc.send('functional-test:test-complete', testName, success);
            this.rpc.send('functional-test:close-connection');

            delete this.activeTests[testName];
        }
    }
}
