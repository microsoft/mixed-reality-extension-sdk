/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { App } from '../app';
import { Test } from '../test';

import {
    VideoPlayerManager
} from '@microsoft/mixed-reality-extension-altspacevr-extras';

export default class AltspaceVRVideoTest extends Test {
    public expectedResultDescription = "Play a couple youtube videos. Click to cycle.";

    private videoPlayerManager: VideoPlayerManager;

    constructor(app: App, baseUrl: string, user: MRESDK.User) {
        super(app, baseUrl, user);
        this.videoPlayerManager = new VideoPlayerManager(app.context);
    }
    public cleanup() {
        this.videoPlayerManager.cleanup();
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

        const video = await MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: tester.value.id,
                name: 'video',
                transform: {
                    position: { x: 0, y: 3, z: 0 },
                    scale: { x: 7, y: 7, z: 7 }
                },
            }
        });

        const cycleState = () => {
            if (this._state === 0) {
                this.app.setOverrideText("Playing Movie!");
                this.videoPlayerManager.play(
                    video.id,
                    'https://www.youtube.com/watch?v=z1YNh9BQVRg',
                    0.0);
            } else if (this._state === 1) {
                this.app.setOverrideText("Switched Movie!");
                this.videoPlayerManager.play(
                    video.id,
                    'https://www.youtube.com/watch?v=UowkIRSDHfs',
                    0.0);
            } else if (this._state === 2) {
                this.app.setOverrideText("Stopped Movie!");
                this.videoPlayerManager.stop(video.id);
            }

            this._state = (this._state + 1) % 3;
        };
        cycleState();

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
                    position: { x: -3.5, y: 5, z: 0 }
                }
            }
        });

        const buttonBehavior = buttonPromise.value.setBehavior(MRESDK.ButtonBehavior);
        buttonBehavior.onClick('pressed', cycleState);

        await this.stoppedAsync();
        return true;
    }
}
