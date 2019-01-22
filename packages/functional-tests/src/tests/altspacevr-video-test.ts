/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

import {
    VideoPlayerManager
} from '@microsoft/mixed-reality-extension-altspacevr-extras';

export default class AltspaceVRVideoTest extends Test {
    private videoPlayerManager: VideoPlayerManager;

    constructor(app: App, private baseUrl: string) {
        super(app);
        this.videoPlayerManager = new VideoPlayerManager(app.context);
    }

    public async run(): Promise<boolean> {
        let success = true;
        success = success && await this.runAltspaceVRVideoTest();
        return success;
    }
    private _state = 0;

    public async runAltspaceVRVideoTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        const textPromise = MRESDK.Actor.CreateEmpty(this.app.context, {
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
        text.text.contents = "Playing Movie!";

        const videoPromise = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: tester.value.id,
                name: 'label',
                transform: {
                    position: { x: 0, y: -1, z: 1 },
                    scale: { x: 7, y: 7, z: 7 }
                },
            }
        });
        await videoPromise;

        this.videoPlayerManager.play(
            videoPromise.value.id,
            'https://www.youtube.com/watch?v=z1YNh9BQVRg',
            0.0);

        const buttonPromise = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 0.4,
                uSegments: 8,
                vSegments: 4

            },
            addCollider: true,
            actor: {
                name: 'Button',
                parentId: tester.value.id,
                transform: {
                    position: { x: -1, y: 1, z: 0 }
                }
            }
        });
        await new Promise<void>((resolve) => {

            const buttonBehavior = buttonPromise.value.setBehavior(MRESDK.ButtonBehavior);
            buttonBehavior.onClick('pressed', (userId: string) => {
                this._state++;
                if (this._state === 1) {
                    text.text.contents = "Switched Movie!";
                    this.videoPlayerManager.play(
                        videoPromise.value.id,
                        'https://www.youtube.com/watch?v=UowkIRSDHfs',
                        0.0);
                }
                if (this._state === 2) {
                    text.text.contents = "Stopped Movie!";
                    this.videoPlayerManager.stop(videoPromise.value.id);
                }
                if (this._state === 3) {
                    resolve();
                }
            });
        });
        // Destroy the actors we created.
        destroyActors(tester.value);

        return true;
    }
}
