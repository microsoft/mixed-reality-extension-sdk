/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const circleKeyframes = [
    { time: 0, value: { transform: { local: { position: { x: 0, y: 0, z: -0.5 } } } } },
    { time: 1, value: { transform: { local: { position: { x: 1, y: 1, z: -0.5 } } } } },
    { time: 2, value: { transform: { local: { position: { x: 0, y: 2, z: -0.5 } } } } },
    { time: 3, value: { transform: { local: { position: { x: -1, y: 1, z: -0.5 } } } } },
    { time: 4, value: { transform: { local: { position: { x: 0, y: 0, z: -0.5 } } } } }
] as MRE.AnimationKeyframe[];

export default class LookAtTest extends Test {
    public expectedResultDescription = "No swivel, XY swivel, Y swivel";
    public interval: NodeJS.Timeout;
    public state = 0;

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

        const tester = MRE.Actor.CreateFromGltf(this.app.context, {
            resourceUrl: `${this.baseUrl}/monkey.glb`,
            actor: { transform: { local: { scale: { x: 0.5, y: 0.5, z: 0.5 } } } }
        }).value;
        const lookAtTarget = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                attachment: {
                    userId: this.user.id,
                    attachPoint: 'head'
                }
            }
        }).value;
        tester.createAnimation('circle', {
            wrapMode: MRE.AnimationWrapMode.Loop,
            keyframes: circleKeyframes
        });
        tester.enableAnimation('circle');

        this.interval = setInterval(() => {
            const modes = [MRE.LookAtMode.TargetXY, MRE.LookAtMode.TargetY, MRE.LookAtMode.None];
            tester.enableLookAt(lookAtTarget, modes[this.state++ % 3]);
        }, 4000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }
}
