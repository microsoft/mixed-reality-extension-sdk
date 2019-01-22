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

export default class AltspaceVRLibraryTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runAltspaceVRLibraryTest();

        return success;
    }

    public async runAltspaceVRLibraryTest(): Promise<boolean> {
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

        // AltspaceVR resource IDs from https://account.altvr.com/kits/
        const libraryActors: Array<MRESDK.ForwardPromise<MRESDK.Actor>> = [];
        libraryActors.push(MRESDK.Actor.CreateFromLibrary(this.app.context, {
            resourceId: "993646440251130011",
            actor: {
                name: 'Campfire Kit: Cabin',
                parentId: tester.value.id,
                transform: {
                    position: { x: 0, y: 0, z: 0.5 },
                    scale: { x: 0.1, y: 0.1, z: 0.1}
                }
            }
        }));
        libraryActors.push(MRESDK.Actor.CreateFromLibrary(this.app.context, {
            resourceId: "1031602421559722256",
            actor: {
                name: 'Home Kit: Chair 2',
                parentId: tester.value.id,
                transform: {
                    position: { x: -1, y: 0, z: 0.5 },
                    rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), -45.0 * MRESDK.DegreesToRadians),
                    scale: { x: 0.7, y: 0.7, z: 0.7}
                }
            }
        }));
        libraryActors.push(MRESDK.Actor.CreateFromLibrary(this.app.context, {
            resourceId: "1049499012731764738",
            actor: {
                name: 'Halloween Kit: Pumpkin Happy',
                parentId: tester.value.id,
                transform: {
                    position: { x: 1, y: 0, z : 0.5 },
                }
            }
        }));
        libraryActors.push(MRESDK.Actor.CreateFromLibrary(this.app.context, {
            resourceId: "995365722689372801",
            actor: {
                name: 'Alien Planet Kit: Island 06',
                parentId: tester.value.id,
                transform: {
                    position: { x: 2, y: 1, z : 0.5 },
                    scale: { x: 0.1, y: 0.1, z: 0.1}
                }
            }
        }));
        libraryActors.push(MRESDK.Actor.CreateFromLibrary(this.app.context, {
            resourceId: "Teleporter:613940881048732244",
            actor: {
                name: 'Teleporter to Campfire',
                parentId: tester.value.id,
                transform: {
                    position: { x: 3, y: 0, z : 0 }
                }
            }
        }));

        await textPromise;
        text.text.contents = "AltspaceVR library samples!";

        // Show the item name when hovering on each item
        libraryActors.forEach((actor: MRESDK.ForwardPromise<MRESDK.Actor>) => {
            if (actor) {
                const buttonBehavior = actor.value.setBehavior(MRESDK.ButtonBehavior);
                // Trigger the grow/shrink animations on hover.
                buttonBehavior.onHover('enter', (userId: string) => {
                    text.text.contents = actor.value.name;
                });
                buttonBehavior.onHover('exit', (userId: string) => {
                    text.text.contents = "";
                });
            }
        });

        // Wait a bit
        await delay(6 * 1000);

        // Destroy the actors we created.
        destroyActors(tester.value);

        return true;
    }
}
