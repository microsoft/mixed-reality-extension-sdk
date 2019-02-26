/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

// tslint:disable:no-string-literal

export default class LightTest extends Test {
    private sceneRoot: MRESDK.Actor;
    private running = true;

    public async run() {
        this.sceneRoot = MRESDK.Actor.CreateEmpty(this.app.context).value;
        const runningTestPromise = this.runTest();
        const timeout = setTimeout(() => this.running = false, 60000);
        await runningTestPromise;
        clearTimeout(timeout);
        return true;
    }

    private async runTest() {
        // Create scene objects.
        const props = this.createProps();
        const label = this.createLabel();
        const sphere = this.createSphere();

        // Click on anything to exit the test.
        for (const actor of this.app.context.actors) {
            actor.setBehavior(MRESDK.ButtonBehavior).onClick('released', () => this.running = false);
        }

        // Updates the label for the test stage.
        const updateLabel = (lightType: string) => {
            label.text.contents =
                `${lightType} Light Test\n` +
                'Click to exit (or wait a minute)';
        };

        // Picks a random color.
        const randomColor = (minValue = 0.15) => {
            return new MRESDK.Color3(
                minValue + Math.random() * (1 - minValue),
                minValue + Math.random() * (1 - minValue),
                minValue + Math.random() * (1 - minValue),
            );
        };

        // Animates the sphere along one side of the scene, with some randomness of final height, and
        // rotating to face the center of the space.
        const animateSide = async (dirX: number, dirZ: number, time: number) => {
            if (this.running) {
                const position = new MRESDK.Vector3(1.5 * dirX, 0.5 + Math.random() * 2, 1.5 * dirZ);
                const rotation = MRESDK.Quaternion.LookAt(
                    position,
                    props['monkey'].transform.position,
                    new MRESDK.Vector3(0, -Math.PI / 8, 0));
                sphere.light.color = randomColor();
                await sphere.animateTo({
                    transform: {
                        position,
                        rotation
                    }
                }, time, MRESDK.AnimationEaseCurves.EaseInOutSine);
            }
        };

        // One loop of the sphere moving along each side of the scene.
        const animateAround = async (time: number) => {
            await animateSide(1, 1, time / 4);
            await animateSide(-1, 1, time / 4);
            await animateSide(-1, -1, time / 4);
            await animateSide(1, -1, time / 4);
        };

        while (this.running) {
            // Spot Light
            updateLabel('Spot');
            sphere.light.copy({
                type: 'spot',
                spotAngle: Math.PI / 3,
                intensity: 15,
                range: 10,
            });
            await animateAround(5);
            // Point Light
            updateLabel('Point');
            sphere.light.copy({
                type: 'point',
                intensity: 10,
                range: 10,
            });
            await animateAround(5);
        }
    }

    private createProps() {
        const props: { [id: string]: MRESDK.Actor } = {};
        props['monkey'] = MRESDK.Actor.CreateFromGltf(this.app.context, {
            resourceUrl: `${this.baseUrl}/monkey.glb`,
            colliderType: 'box',
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    scale: { x: 0.75, y: 0.75, z: 0.75 },
                    position: { y: 1 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), Math.PI)
                }
            }
        }).value;
        const propWidth = 0.4;
        const propHeight = 0.4;
        props['left-box'] = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: propWidth, z: propWidth, y: propHeight }
            },
            addCollider: true,
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: {
                        x: -propWidth * 2, y: propHeight / 2
                    }
                }
            }
        }).value;
        props['right-box'] = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box,
                dimensions: { x: propWidth, z: propWidth, y: propHeight }
            },
            addCollider: true,
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: {
                        x: propWidth * 2, y: propHeight / 2
                    }
                }
            }
        }).value;
        return props;
    }

    private createLabel() {
        return MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { y: 3 }
                },
                text: {
                    anchor: MRESDK.TextAnchorLocation.TopCenter,
                    justify: MRESDK.TextJustify.Center,
                    height: 0.4,
                    color: MRESDK.Color3.Yellow()
                }
            }
        }).value;
    }

    private createSphere() {
        return MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 0.1
            },
            addCollider: true,
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { y: 1 }
                },
                light: { type: 'spot' } // Add a light component.
            }
        }).value;
    }
}
