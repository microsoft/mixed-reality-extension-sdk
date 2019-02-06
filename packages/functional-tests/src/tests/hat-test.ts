/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

// tslint:disable:no-string-literal

export default class HatTest extends Test {
    private sceneRoot: MRESDK.Actor;
    private running = true;

    private hatNames = ['wizardhat', 'strawhat', 'tophat', 'LavaHelmet', 'redhat', 'hardhat'];
    private modelScaleFactor = 1 / 60;

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run() {
        this.sceneRoot = MRESDK.Actor.CreateEmpty(this.app.context).value;
        const runningTestPromise = this.runTest();
        const timeout = setTimeout(() => this.running = false, 60000);
        await runningTestPromise;
        clearTimeout(timeout);
        return true;
    }

    private async runTest() {
        // Wear some hats!
        while (this.running) {
            // Show a menu of hats for selection. Return the name of the selected hat and the user that selected it.
            const { hatName, user } = await this.selectHat();
            if (hatName) {
                // Create the selected hat.
                const hat = this.createHat(hatName);
                // Attach hat to avatar and wait five seconds. Feel free to walk around in your new hat!
                hat.attach(user, 'head');
                await delay(5000, this.running);
                // Detach hat and wait another five seconds.
                hat.detach();
                await delay(5000, this.running);
                // Destroy the hat.
                destroyActors(hat);
            }
        }
    }

    private async selectHat(): Promise<{ hatName?: string, user?: MRESDK.User }> {
        return {};
    }

    private createHat(hatName: string): MRESDK.Actor {
        return undefined;
    }
}
