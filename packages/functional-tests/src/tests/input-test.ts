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

        // Create a new actor with no mesh, but some text. This operation is asynchronous, so
        // it returns a "forward" promise (a special promise, as we'll see later).
        const textPromise = Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 0.5, z: 0 }
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
        text.text.contents = "Please Hover";

        // Load a glTF model
        const modelPromise = Actor.CreateFromGltf(this.app.context, {
            // at the given URL
            resourceUrl: `${this.baseUrl}/monkey.glb`,
            // and spawn box colliders around the meshes.
            colliderType: 'box',
            // Also apply the following generic actor properties.
            actor: {
                name: 'clickable',
                // Parent the glTF model to the text actor.
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 1.3, z: 0 },
                    scale: { x: 0.4, y: 0.4, z: 0.4 }
                }
            }
            });

        const model = modelPromise.value;
        // Create some animations on the cube.
        model.createAnimation({
            animationName: 'GrowIn',
            keyframes: this.growAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create grow animation: ${reason}`));

        model.createAnimation({
            animationName: 'ShrinkOut',
            keyframes: this.shrinkAnimationData,
            events: []
        }).catch(reason => console.log(`Failed to create shrink animation: ${reason}`));

        model.createAnimation({
            animationName: 'DoAFlip',
            keyframes: this.generateSpinKeyframes(0.5, MRESDK.Vector3.Up()),
            events: []
        }).catch(reason => console.log(`Failed to create flip animation: ${reason}`));

        // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
        // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
        const buttonBehavior = model.setBehavior(MRESDK.ButtonBehavior);

        await new Promise<void>((resolve) => {
            let stateCounter = 0;
            // Trigger the grow/shrink animations on hover.
            buttonBehavior.onHover('enter', (userId: string) => {
                model.startAnimation('GrowIn');
                if (stateCounter === 0) {
                   stateCounter ++;
                   text.text.contents = "Please Click";
                }
            });
            // When clicked, do a 360 sideways.
            buttonBehavior.onClick('pressed', (userId: string) => {
                model.startAnimation('DoAFlip');
                if (stateCounter === 1) {
                    stateCounter ++;
                    text.text.contents = "Please Unhover";
                }
             });

            buttonBehavior.onHover('exit', (userId: string) => {
                model.startAnimation('ShrinkOut');
                if (stateCounter === 2) {
                    resolve();
                } else {
                    stateCounter = 0;
                    text.text.contents = "Please Hover Again";
                }
             });

        });

        await delay(0.3 * 1000);
        text.text.contents = "Thank you for your cooperation";
        await delay(1.2 * 1000);

        destroyActors(tester.value);

        return true;
    }

     private generateSpinKeyframes(duration: number, axis: MRESDK.Vector3): MRESDK.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: MRESDK.Quaternion.RotationAxis(axis, 0) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: MRESDK. Quaternion.RotationAxis(axis, Math.PI) } }
        }];
    }

    private growAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 0.4, y: 0.4, z: 0.4 } } }
    }, {
        time: 0.3,
        value: { transform: { scale: { x: 0.5, y: 0.5, z: 0.5 } } }
    }];

    private shrinkAnimationData: MRESDK.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 0.5, y: 0.5, z: 0.5 } } }
    }, {
        time: 0.3,
        value: { transform: { scale: { x: 0.4, y: 0.4, z: 0.4 } } }
    }];

}
