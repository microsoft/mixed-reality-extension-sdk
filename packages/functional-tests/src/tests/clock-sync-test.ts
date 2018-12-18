/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class ClockSyncTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runClockSyncTest();

        return success;
    }

    public async runClockSyncTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const boxYPosition = 1;
        const lineHeight = 1.15; // magic value based on default font

        // Create the clock background strip.
        MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: 10.5, y: 0.1, z: 1.0 }
            },
            actor: {
                parentId: tester.value.id,
                transform: {
                    position: { x: 0.0, y: boxYPosition, z: 0.1 }
                }
            }
        });

        // Create the digits.
        const meshHundredths =
            this.createAnimatableDigit('hundredths', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.value.id);
        const meshTenths = this.createAnimatableDigit('tenths', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.value.id);
        const meshSeconds = this.createAnimatableDigit('seconds', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.value.id);
        const mesh10Seconds = this.createAnimatableDigit('10seconds', '0\n1\n2\n3\n4\n5\n0', tester.value.id);
        const meshMinutes = this.createAnimatableDigit('minutes', '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', tester.value.id);
        const mesh10Minutes = this.createAnimatableDigit('10minutes', '0\n1\n2\n3\n4\n5\n0', tester.value.id);
        const meshHours =
            this.createAnimatableDigit('hours',
            '0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n0', tester.value.id);
        const mesh10Hours = this.createAnimatableDigit('10hours', ' \n1\n2\n ', tester.value.id);

        // Make a handy array of all the digits.
        const actors = [
            meshHundredths, meshTenths, meshSeconds, mesh10Seconds, meshMinutes, mesh10Minutes, meshHours, mesh10Hours];

        // Build animations.
        const yOffset = boxYPosition + lineHeight * 0.5;
        const animations = [
            this.buildDigitAnimation(meshHundredths.value, 4.25, yOffset, 1 / 100, 10, 10, lineHeight),
            this.buildDigitAnimation(meshTenths.value, 3.25, yOffset, 1 / 10, 10, 10, lineHeight),
            this.buildDigitAnimation(meshSeconds.value, 1.75, yOffset, 1, 10, 10, lineHeight),
            this.buildDigitAnimation(mesh10Seconds.value, 0.75, yOffset, 10, 6, 6, lineHeight),
            this.buildDigitAnimation(meshMinutes.value, -0.75, yOffset, 60, 10, 10, lineHeight),
            this.buildDigitAnimation(mesh10Minutes.value, -1.75, yOffset, 10 * 60, 6, 6, lineHeight),
            this.buildDigitAnimation(meshHours.value, -3.25, yOffset, 60 * 60, 24, 24, lineHeight),
            this.buildDigitAnimation(mesh10Hours.value, -4.25, yOffset, 10 * 60 * 60, 3, 2.4, lineHeight)
        ];

        // Wait for all actors and animations to instantiate on the host.
        await Promise.all([actors, animations]);

        // Start the animations.
        actors.forEach(actor => actor.value.startAnimation('anim'));

        // Wait for some seconds.
        await delay(20000);

        // Stop the animations.
        actors.forEach(actor => actor.value.stopAnimation('anim'));

        // Wait a bit.
        await delay(3000);

        // Destroy the actors we created.
        destroyActors(tester.value);

        return true;
    }

    public createAnimatableDigit(name: string, digits: string, parentId: string): MRESDK.ForwardPromise<MRESDK.Actor> {
        return MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name,
                parentId,
                text: {
                    contents: digits,
                    anchor: MRESDK.TextAnchorLocation.TopCenter
                }
            }
        });
    }

    public buildDigitAnimation(
        mesh: MRESDK.Actor,
        xOffset: number,
        yOffset: number,
        secondsPerStep: number,
        digits: number,
        frameCount: number,
        lineHeight: number): Promise<void> {

        const keyframes: MRESDK.AnimationKeyframe[] = [];

        // test: set to 0.01 to speed up 100x
        const timeScale = 1.0;

        const interpolationTimeSeconds = 0.1;

        // insert 2 keyframes per digit - start and (end-interpolationtime).
        // Special case is the very last digit,
        // which only inserts a start key, as the animation then snaps back to start at the rollover time
        for (let i = 0; i <= digits; ++i) {
            const value = {
                transform: {
                    position: {
                        x: xOffset,
                        y: yOffset + i * lineHeight,
                        z: 0,
                    }
                }
            };

            let frameNumber = i;
            if (i >= frameCount) {
                frameNumber = frameCount;
            }
            keyframes.push({
                time: timeScale * frameNumber * secondsPerStep,
                value
            });

            if (i < frameCount && secondsPerStep >= 1) {
                let frameNumber1 = i + 1;
                if (i + 1 >= frameCount) {
                    frameNumber1 = frameCount;
                }
                keyframes.push({
                    time: timeScale * (frameNumber1 * secondsPerStep - interpolationTimeSeconds),
                    value
                });
            }
        }

        return mesh.createAnimation({
            animationName: 'anim',
            wrapMode: MRESDK.AnimationWrapMode.Loop,
            events: [],
            keyframes
        });
    }
}
