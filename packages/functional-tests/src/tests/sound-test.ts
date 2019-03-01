/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { Actor } from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class SoundTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runSoundTest();

        return success;
    }

    public async runSoundTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const textPromise = Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 2, z: 0 }
                },
                text: {
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 0.3
                }
            }
        });

        const text = textPromise.value;
        await textPromise;
        text.text.contents = "Preloading Sound";

        const soundAssetPromise = this.app.context.assetManager.createSound(
            'meh',
            {
                uri: `${this.baseUrl}/music.mod`,
                // uri: `${this.baseUrl}/boo.wav`,
            });

        // await soundAssetPromise;

        text.text.contents = "Starting Sound";
        const soundInstance = text.startSound(soundAssetPromise.value.id,
            {
                volume: 0.5,
                looping: true,
                doppler: 0.0,
                multiChannelSpread: 0.2,
                rolloffStartDistance: 1.0
            },
            0);
        await delay(3 * 1000);

        text.text.contents = `Sound duration: ${soundAssetPromise.value.duration} seconds`;
        if (true) {
            await delay(10000 * 1000);
        } else {
            await delay(2 * 1000);

            text.text.contents = "Increasing Pitch by 12 semitones";
            soundInstance.value.setSoundState({
                pitch: 12.0,
            });
            await delay(3 * 1000);

            text.text.contents = "Resetting Pitch";
            soundInstance.value.setSoundState({
                pitch: 0.0,
            });
            await delay(1 * 1000);

            text.text.contents = "Raising Volume";
            soundInstance.value.setSoundState({
                volume: 1.0
            });
            await delay(5 * 1000);

            text.text.contents = "Pausing";
            soundInstance.value.pause();
            await delay(2 * 1000);

            text.text.contents = "resuming";
            soundInstance.value.resume();
            await delay(300 * 1000);
        }

        text.text.contents = "Stopping Sound";
        soundInstance.value.stop();
        this.app.context.assetManager.unloadAsset(soundAssetPromise.value);

        await delay(6 * 1000);

        return true;
    }
}
