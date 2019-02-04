/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class ReparentTest extends Test {
    private sceneRoot: MRESDK.Actor;
    private running = true;

    constructor(app: App) {
        super(app);
    }

    public async run(): Promise<boolean> {
        this.sceneRoot = MRESDK.Actor.CreateEmpty(this.app.context).value;
        const runningTestPromise = this.runTest();
        const timeout = setTimeout(() => this.running = false, 60000);
        await runningTestPromise;
        clearTimeout(timeout);
        destroyActors(this.sceneRoot);
        return true;
    }

    private async runTest() {
        MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { y: 3 }
                },
                text: {
                    contents:
                        'Reparenting Test\n' +
                        'Sphere should be jumping left and right\n' +
                        'Click to exit (or wait a minute)',
                    anchor: MRESDK.TextAnchorLocation.TopCenter,
                    justify: MRESDK.TextJustify.Center,
                    height: 0.4,
                    color: MRESDK.Color3.Yellow()
                }
            }
        });
        const leftParent = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { x: -1, y: 1 }
                }
            }
        }).value;
        const rightParent = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { x: 1, y: 1 }
                }
            }
        }).value;

        const sphere = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 0.25
            },
            addCollider: true,
            actor: {
                parentId: leftParent.id
            }
        }).value;

        let currParent = 0;
        const parentIds = [leftParent.id, rightParent.id];

        const buttonBehavior = sphere.setBehavior(MRESDK.ButtonBehavior);
        buttonBehavior.onClick('released', () => this.running = false);

        while (this.running) {
            for (let i = 0; i < 10 && this.running; ++i) {
                await delay(100);
            }
            currParent = 1 - currParent;
            sphere.parentId = parentIds[currParent];
        }
    }
}
