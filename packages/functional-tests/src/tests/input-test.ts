/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { Actor, AnimationWrapMode } from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

let stateCounter = 0;

export default class InputTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runInputTest();

        return success;
    }

    public async runInputTest(): Promise<boolean> {

        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});
        const actorRoot = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: "actorRoot",
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 0.2, z: 0 },
                }
            }
        });
        // Create a cannonball.
        const actor = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: {
                    x: 1,
                    y: 0.4,
                    z: 3
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
            time: 1.0,
            value: {
                transform: {
                    position: {
                        x: 0,
                        y: 0,
                        z: 1,
                    }
                }
            }
        });
        actor.value.createAnimation({
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
            time: 1.0,
            value: {
                transform: {
                    rotation: { x: 0, y: 0.707, z: 0, w: 0.707 },
                }
            }
        });
        actor.value.createAnimation({
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
            time: 1.0,
            value: {
                transform: {
                    scale: { x: 1.3, y: 1.3, z: 1.3 },
                }
            }
        });
        actor.value.createAnimation({
            animationName: 'animscale',
            wrapMode: AnimationWrapMode.Once,
            events: [],
            keyframes: keyframes3

        });

        const buttonBehavior = actor.value.setBehavior(MRESDK.ButtonBehavior);
        console.log(`Added event.`);

        buttonBehavior.onClick('pressed', (userId: string) => {
            if (stateCounter === 0) {
                actor.value.startAnimation('animmove', true);
                stateCounter = 1;
            } else if (stateCounter === 1) {
                actor.value.stopAnimation('animmove');
                actor.value.startAnimation('animturn', true);
                stateCounter = 2;
            } else if (stateCounter === 2) {
                actor.value.stopAnimation('animturn');
                actor.value.startAnimation('animscale', true);
                stateCounter = 3;
            } else if (stateCounter === 3) {
                actor.value.stopAnimation('animscale');
                stateCounter = 0;
            }

            console.log('debug', `Click on actor.`);
        });

        buttonBehavior.onHover('enter', (userId: string) => {
            console.log('debug', `Hover entered on actor.`);
        });

        buttonBehavior.onHover('exit', (userId: string) => {
            console.log('debug', `Hover exited on actor.`);
        });

        await delay(30 * 1000);

        destroyActors(tester.value);

        return true;
    }

}
