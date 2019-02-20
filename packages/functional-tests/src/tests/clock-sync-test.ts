/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import { Test } from '../test';

export default class ClockSyncTest extends Test {

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runClockSyncTest();

        return success;
    }

    public async runClockSyncTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const textPromise = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 2.5, z: -0.5 }
                },
                text: {
                    contents: "A clock driven by looping animations. Click to exit test",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 0.3
                }
            }
        });

        const textScale = 0.15;
        const boxYPosition = 20;
        const boxHeight = 20 * textScale;
        const boxWidth = 10 * textScale;
        const boxGap = textScale * 0.6;
        const lineHeight = 1.20; // magic value based on default font

        const topBox = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: boxWidth, y: boxHeight, z: 0.2 }
            },
            addCollider: true,
            actor: {
                parentId: tester.value.id,
                transform: {
                    position: { x: 0.0, y: boxYPosition * textScale + (boxHeight / 2 + boxGap), z: 0.05 }
                }
            }
        });
        const bottomBox = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: boxWidth, y: boxHeight, z: 0.2 }
            },
            addCollider: true,
            actor: {
                parentId: tester.value.id,
                transform: {
                    position: { x: 0.0, y: boxYPosition * textScale - (boxHeight / 2 + boxGap), z: 0.05 }
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
            this.buildDigitAnimation(meshHundredths.value, 4.25, yOffset, 1 / 100, 10, 10, lineHeight, textScale),
            this.buildDigitAnimation(meshTenths.value, 3.25, yOffset, 1 / 10, 10, 10, lineHeight, textScale),
            this.buildDigitAnimation(meshSeconds.value, 1.75, yOffset, 1, 10, 10, lineHeight, textScale),
            this.buildDigitAnimation(mesh10Seconds.value, 0.75, yOffset, 10, 6, 6, lineHeight, textScale),
            this.buildDigitAnimation(meshMinutes.value, -0.75, yOffset, 60, 10, 10, lineHeight, textScale),
            this.buildDigitAnimation(mesh10Minutes.value, -1.75, yOffset, 10 * 60, 6, 6, lineHeight, textScale),
            this.buildDigitAnimation(meshHours.value, -3.25, yOffset, 60 * 60, 24, 24, lineHeight, textScale),
            this.buildDigitAnimation(mesh10Hours.value, -4.25, yOffset, 10 * 60 * 60, 3, 2.4, lineHeight, textScale)
        ];

        // Wait for all actors and animations to instantiate on the host.
        await Promise.all([actors, animations]);

        // Start the animations.
        actors.forEach(actor => actor.value.enableAnimation('anim'));

        // Wait for some seconds.
        await new Promise<void>((resolve) => {
            const topBoxBehavior = topBox.value.setBehavior(MRESDK.ButtonBehavior);
            // When clicked, do a 360 sideways.
            topBoxBehavior.onClick('pressed', (userId: string) => {
                resolve();
            });
            const bottomBoxBehavior = bottomBox.value.setBehavior(MRESDK.ButtonBehavior);
            // When clicked, do a 360 sideways.
            bottomBoxBehavior.onClick('pressed', (userId: string) => {
                resolve();
            });
        });

        // Stop the animations.
        actors.forEach(actor => actor.value.disableAnimation('anim'));

        // Wait a bit.
        await delay(1 * 1000);

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
        lineHeight: number,
        scale: number): Promise<void> {

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
                        x: (xOffset) * scale,
                        y: (yOffset + i * lineHeight) * scale,
                        z: 0,
                    },
                    scale: { x: scale, y: scale, z: scale }
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

        return mesh.createAnimation(
            'anim', {
                wrapMode: MRESDK.AnimationWrapMode.Loop,
                keyframes
            });
    }
}
