/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class ReparentTest extends Test {
    public expectedResultDescription = "Sphere should be jumping left, center, and right";
    private interval: NodeJS.Timeout;

    public async run(): Promise<boolean> {
        const leftParent = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: -0.7, y: 0.3, z: -0.3 }
                    }
                }
            }
        }).value;
        const rightParent = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                transform: {
                    local: {
                        position: { x: 0.7, y: 0.3, z: -0.3 }
                    }
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

        let nextParent = 1;
        const parentIds = [leftParent.id, null, rightParent.id];
        this.interval = setInterval(() => {
            sphere.parentId = parentIds[nextParent];
            nextParent = (nextParent + 1) % parentIds.length;
        }, 1000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }
}
