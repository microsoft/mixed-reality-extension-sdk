/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ReparentTest extends Test {
    public expectedResultDescription = "Sphere should be jumping left and right";
    private interval: NodeJS.Timeout;

    public async run(): Promise<boolean> {
        const leftParent = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: -1 }
                }
            }
        }).value;
        const rightParent = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    position: { x: 1 }
                }
            }
        }).value;

        const sphere = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.25
            },
            actor: {
                parentId: leftParent.id
            }
        }).value;

        let currParent = 0;
        const parentIds = [leftParent.id, rightParent.id];
        this.interval = setInterval(() => {
            currParent = 1 - currParent;
            sphere.parentId = parentIds[currParent];
        }, 1000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }
}
