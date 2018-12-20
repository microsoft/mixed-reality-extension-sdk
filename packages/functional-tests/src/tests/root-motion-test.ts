/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { Actor, AnimationWrapMode } from '@microsoft/mixed-reality-extension-sdk';
import { promises } from 'fs';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class RootMotionTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runRootMotionTest();

        return success;
    }

    public async runRootMotionTest(): Promise<boolean> {

        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const textPromise = Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 1.0, z: 1 }
                },
                text: {
                    contents: "Click to make actor move, turn, and scale",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 0.3
                }
            }
        });

        const text = textPromise.value;

        const actorRoot = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: "actorRoot",
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 0.3, z: 0 },
                }
            }
        });

        const actor = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: {
                    x: 0.3,
                    y: 0.6,
                    z: 1.1
                },
            },
            addCollider: true,
            actor: {
                parentId: actorRoot.value.id,
            }
        });

        const keyframes: MRESDK.AnimationKeyframe[] = [];
        keyframes.push({
            time: 0.0,
            value: {
                transform: {
                    position: {
                        x: 0,
                        y: 0,
                        z: 0,
                    }
                }
            }
        });
        keyframes.push({
            time: 0.4,
            value: {
                transform: {
                    position: {
                        x: 0,
                        y: 0,
                        z: -0.7,
                    }
                }
            }
        });
        const moveAnimation = actor.value.createAnimation({
            animationName: 'animmove',
            wrapMode: AnimationWrapMode.Once,
            events: [],
            keyframes

        });

        const keyframes2: MRESDK.AnimationKeyframe[] = [];
        keyframes2.push({
            time: 0.0,
            value: {
                transform: {
                    rotation: { x: 0, y: 0, z: 0, w: 1 },
                }
            }
        });
        keyframes2.push({
            time: 0.7,
            value: {
                transform: {
                    rotation: { x: 0, y: 0.707, z: 0, w: 0.707 },
                }
            }
        });
        const turnAnimation = actor.value.createAnimation({
            animationName: 'animturn',
            wrapMode: AnimationWrapMode.Once,
            events: [],
            keyframes: keyframes2

        });

        const keyframes3: MRESDK.AnimationKeyframe[] = [];
        keyframes3.push({
            time: 0.0,
            value: {
                transform: {
                    scale: { x: 1, y: 1, z: 1 },
                }
            }
        });
        keyframes3.push({
            time: 0.4,
            value: {
                transform: {
                    scale: { x: 1.5, y: 1.5, z: 1.5 },
                }
            }
        });
        const scaleAnimation = actor.value.createAnimation({
            animationName: 'animscale',
            wrapMode: AnimationWrapMode.Once,
            events: [],
            keyframes: keyframes3

        });
        await Promise.all([moveAnimation, turnAnimation, scaleAnimation]);
        const buttonBehavior = actor.value.setBehavior(MRESDK.ButtonBehavior);
        console.log(`Added event.`);

        await new Promise<void>((resolve) => {
            let stateCounter = 0;

            buttonBehavior.onClick('pressed', (userId: string) => {
                if ((stateCounter % 3) === 0) {
                    actor.value.startAnimation('animmove', true);
                    if (stateCounter !== 0) {
                        actor.value.stopAnimation('animscale');
                    }
                } else if ((stateCounter % 3) === 1) {
                    actor.value.stopAnimation('animmove');
                    actor.value.startAnimation('animturn', true);
                } else if ((stateCounter % 3) === 2) {
                    actor.value.stopAnimation('animturn');
                    actor.value.startAnimation('animscale', true);
                }
                stateCounter++;

                if (stateCounter === 7) {
                    resolve();
                }
                console.log('debug', `Click on actor.`);
            });
        });

        destroyActors(tester.value);

        return true;
    }
}
