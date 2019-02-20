/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { Actor } from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import { Test } from '../test';

export default class PrimitivesTest extends Test {

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runPrimitivesTest();

        return success;
    }

    public async runPrimitivesTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const textPromise = Actor.CreateEmpty(this.app.context, {
            actor: {
                name: 'label',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 2, z: -1 }
                },
                text: {
                    contents: "Primitives Test",
                    anchor: MRESDK.TextAnchorLocation.MiddleCenter,
                    color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
                    height: 0.3
                }
            }
        });

        const text = textPromise.value;

        const primitiveActors: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = [];

        for (let x = 0.1; x < 0.35; x += 0.1) {
            for (let y = 0.1; y < 0.35; y += 0.1) {
                for (let z = 0.1; z < 0.35; z += 0.1) {
                    primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
                        definition: {
                            shape: MRESDK.PrimitiveShape.Box,
                            dimensions: { x, y, z }
                        },
                        addCollider: true,
                        actor: {
                            name: 'Box',
                            parentId: tester.value.id,
                            transform: {
                                position: { x: x * 4 - 0.8, y: y * 4 + 0.3, z: z * 4 - 0.5 }
                            }
                        }
                    }));

                }
            }
        }
        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 0.4,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'Sphere',
                parentId: tester.value.id,
                transform: {
                    position: { x: -1, y: 1, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Capsule,
                dimensions: { x: 0, y: 0.7, z: 0 },
                radius: 0.3,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'Capsule',
                parentId: tester.value.id,
                transform: {
                    position: { x: 1, y: 1, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Capsule,
                dimensions: { x: 0.35, y: 0.0, z: 0 },
                radius: 0.15,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'Capsule',
                parentId: tester.value.id,
                transform: {
                    position: { x: 1, y: 2.0, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Capsule,
                dimensions: { x: 0, y: 0.0, z: 0.7 },
                radius: 0.3,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'Capsule',
                parentId: tester.value.id,
                transform: {
                    position: { x: 1, y: 1, z: 1.5 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Cylinder,
                dimensions: { x: 0, y: 1.3, z: 0 },
                radius: 0.3,
                uSegments: 8,

            },
            addCollider: true,
            actor: {
                name: 'Cylinder',
                parentId: tester.value.id,
                transform: {
                    position: { x: 2, y: 1, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Cylinder,
                dimensions: { x: 0.65, y: 0, z: 0 },
                radius: 0.15,
                uSegments: 8,

            },
            addCollider: true,
            actor: {
                name: 'Cylinder',
                parentId: tester.value.id,
                transform: {
                    position: { x: 2, y: 2.0, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Cylinder,
                dimensions: { x: 0, y: 0, z: 1.3 },
                radius: 0.3,
                uSegments: 8,

            },
            addCollider: true,
            actor: {
                name: 'Cylinder',
                parentId: tester.value.id,
                transform: {
                    position: { x: 2, y: 1, z: 1.5 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Plane,
                dimensions: { x: 1, y: 0, z: 1 },
                uSegments: 1,
                vSegments: 4,

            },
            addCollider: true,
            actor: {
                name: 'Plane',
                parentId: tester.value.id,
                transform: {
                    position: { x: -2, y: 0.5, z: 0 }
                }
            }
        }));

        primitiveActors.push(MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.InnerSphere,
                radius: 3,
                uSegments: 12,
                vSegments: 8

            },
            addCollider: true,
            actor: {
                name: 'Inner Sphere',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 6, z: 0 }
                }
            }
        }));

        await textPromise;
        text.text.contents = "Click on primitive to exit";

        // Wait for user to click on item
        await new Promise<void>((resolve) => {

            primitiveActors.forEach((actor: MRESDK.ForwardPromise<MRESDK.Actor>) => {
                if (actor) {
                    const buttonBehavior = actor.value.setBehavior(MRESDK.ButtonBehavior);
                    // Trigger the grow/shrink animations on hover.
                    buttonBehavior.onHover('enter', (userId: string) => {
                        text.text.contents = actor.value.name;
                    });
                    // When clicked, do a 360 sideways.
                    buttonBehavior.onClick('pressed', (userId: string) => {
                        resolve();
                    });
                    buttonBehavior.onHover('exit', (userId: string) => {
                        text.text.contents = "";
                    });
                }
            });
        });

        // Destroy the actors we created.
        destroyActors(tester.value);

        return true;
    }
}
