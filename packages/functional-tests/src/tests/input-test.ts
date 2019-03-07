/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class InputTest extends Test {
    public expectedResultDescription = "Hover, click, and unhover";

    private state = 0;
    private spinCount = 0;
    private model: MRE.Actor;

    public async run(): Promise<boolean> {
        MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: "Light",
                light: {
                    type: 'point',
                    range: 5,
                    intensity: 2,
                    color: { r: 1, g: 0.5, b: 0.3 }
                },
                transform: {
                    position: { x: -2, y: 2, z: -2 }
                }
            }
        });

        // Load a glTF model
        this.model = MRE.Actor.CreateFromGltf(this.app.context, {
            // at the given URL
            resourceUrl: `${this.baseUrl}/monkey.glb`,
            // and spawn box colliders around the meshes.
            colliderType: 'box',
            // Also apply the following generic actor properties.
            actor: {
                name: 'clickable',
                transform: {
                    scale: { x: 0.4, y: 0.4, z: 0.4 },
                    position: { x: 0, y: 1, z: -1 }
                }
            }
        }).value;

        // Create some animations on the cube.
        this.model.createAnimation(
            'GrowIn', {
                keyframes: this.growAnimationData
            });

        this.model.createAnimation(
            'ShrinkOut', {
                keyframes: this.shrinkAnimationData
            });

        this.model.createAnimation(
            'Spin1', {
                keyframes: this.generateSpinKeyframes(0.5, MRE.Vector3.Up()),
            });

        this.model.createAnimation(
            'Spin2', {
                keyframes: this.generateSpinKeyframes(0.5, MRE.Vector3.Up(), Math.PI),
            });

        // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
        // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
        const behavior = this.model.setBehavior(MRE.ButtonBehavior);
        behavior.onHover('enter', _ => {
            this.state = 1;
            this.cycleState();
        });
        behavior.onClick('pressed', _ => {
            this.state = 2;
            this.cycleState();
        });
        behavior.onHover('exit', _ => {
            this.state = 0;
            this.cycleState();
        });

        this.cycleState();
        await this.stoppedAsync();

        this.model.setBehavior(null);
        this.app.setOverrideText("Thank you for your cooperation");
        await delay(1.2 * 1000);

        return true;
    }

    private cycleState() {
        switch (this.state) {
            case 0:
                this.model.enableAnimation('ShrinkOut');
                this.app.setOverrideText("Please Hover");
                break;
            case 1:
                this.model.enableAnimation('GrowIn');
                this.app.setOverrideText("Please Click");
                break;
            case 2:
                if (this.spinCount % 2 === 0) {
                    this.model.enableAnimation('Spin1');
                } else {
                    this.model.enableAnimation('Spin2');
                }
                this.spinCount++;
                this.app.setOverrideText("Please Unhover");
                break;
            default:
                throw new Error("How did we get here?");
        }
    }

    private generateSpinKeyframes(duration: number, axis: MRE.Vector3, start = 0): MRE.AnimationKeyframe[] {
        return [{
            time: 0 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start) } }
        }, {
            time: 0.5 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI / 2) } }
        }, {
            time: 1 * duration,
            value: { transform: { rotation: MRE.Quaternion.RotationAxis(axis, start + Math.PI) } }
        }];
    }

    private growAnimationData: MRE.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 0.4, y: 0.4, z: 0.4 } } }
    }, {
        time: 0.3,
        value: { transform: { scale: { x: 0.5, y: 0.5, z: 0.5 } } }
    }];

    private shrinkAnimationData: MRE.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { scale: { x: 0.5, y: 0.5, z: 0.5 } } }
    }, {
        time: 0.3,
        value: { transform: { scale: { x: 0.4, y: 0.4, z: 0.4 } } }
    }];

}
