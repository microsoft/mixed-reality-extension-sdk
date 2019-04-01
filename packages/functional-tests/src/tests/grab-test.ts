/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class GrabTest extends Test {
    public expectedResultDescription = "Different grabbable items.";

    private state = 0;
    private clickCount = 0;
    private model: MRE.Actor;

    private readonly SCALE = 0.2;

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
                    local: {
                        position: { x: -2, y: 2, z: -2 }
                    }
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
                    local: {
                        scale: { x: this.SCALE, y: this.SCALE, z: this.SCALE },
                        position: { x: 0, y: 1, z: -1 }
                    }
                }
            }
        }).value;

        // Create some animations on the cube.
        this.model.createAnimation(
            'OnClick', {
                keyframes: this.clickAnimationData
            });

        // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
        // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
        const behavior = this.model.setBehavior(MRE.ButtonBehavior);
        behavior.onClick('released', _ => {
            this.state = 3;
            this.cycleState();
        });

        // Make the actor grabbable and update state based on grab.
        this.model.grabbable = true;
        this.model.onGrab('begin', _ => {
            this.state = 1;
            this.cycleState();
        });
        this.model.onGrab('end', _ => {
            this.state = 2;
            this.cycleState();
        });

        // Create two grabbable cubes that can be played with at will.  Position left
        // anr right of the monkey.
        for (const cube of [{ name: 'Cube1', x: -1}, { name: 'Cube2', x: 1}]) {
            MRE.Actor.CreatePrimitive(this.app.context, {
                definition: {
                    shape: MRE.PrimitiveShape.Box,
                    dimensions: { x: 0.5, y: 0.5, z: 0.5 }
                },
                addCollider: true,
                actor: {
                    name: cube.name,
                    transform: { local: { position: { x: cube.x, y: 1, z: -1 } } }
                }
            }).value.grabbable = true;
        }

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
                this.app.setOverrideText("Please grab the monkey");
                break;
            case 1:
                this.app.setOverrideText("Move the monkey then release grab.");
                break;
            case 2:
                this.app.setOverrideText("Please click monkey to turn off grab.");
                break;
            case 3:
                if (this.clickCount % 2 === 0) {
                    this.model.enableAnimation('OnClick');
                    this.model.grabbable = false;
                    this.app.setOverrideText("Click to make monkey grabbable again.");
                } else {
                    this.model.enableAnimation('OnClick');
                    this.model.grabbable = true;
                    this.state = 0;
                    this.cycleState();
                }
                this.clickCount++;
                break;
            default:
                throw new Error(`How did we get here? State: ${this.state}`);
        }
    }

    private clickAnimationData: MRE.AnimationKeyframe[] = [{
        time: 0,
        value: { transform: { local: { scale: { x: this.SCALE, y: this.SCALE, z: this.SCALE } } } }
    }, {
        time: 0.1,
        value: { transform: { local: { scale: { x: this.SCALE + 0.1, y: this.SCALE + 0.1, z: this.SCALE + 0.1 } } } }
    }, {
        time: 0.2,
        value: { transform: { local: { scale: { x: this.SCALE, y: this.SCALE, z: this.SCALE } } } }
    }];

}
