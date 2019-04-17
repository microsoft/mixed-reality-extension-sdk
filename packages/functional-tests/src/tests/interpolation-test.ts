/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';
import delay from '../utils/delay';

export default class InterpolationTest extends Test {
    public expectedResultDescription = "Lerping scale and rotation";
    public async run(root: MRE.Actor): Promise<boolean> {
        MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                name: "Light",
                parentId: root.id,
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

        const cube = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.65, y: 0.65, z: 0.65 }
            },
            actor: {
                parentId: root.id,
                transform: {
                    local: {
                        position: { y: 1.0, z: -1.0 }
                    }
                }
            },
            addCollider: true
        }).value;

        while (!this.stopped) {
            // Random point on unit sphere (pick random axis).
            const θ = Math.random() * 2 * Math.PI;
            const z = Math.cos(θ);
            const x = Math.sqrt(1 - z * z) * Math.cos(θ);
            const y = Math.sqrt(1 - z * z) * Math.sin(θ);
            const axis = new MRE.Vector3(x, y, z);
            // Random rotation around picked axis.
            const rotation = MRE.Quaternion.RotationAxis(axis, Math.random() * 2 * Math.PI);
            // Random scale in [0.3..1.0].
            const scalar = 0.3 + 0.7 * Math.random();
            const scale = new MRE.Vector3(scalar, scalar, scalar);
            // Random ease curve.
            const easeCurveKeys = Object.keys(MRE.AnimationEaseCurves);
            const easeIndex = Math.floor(Math.random() * easeCurveKeys.length);
            const easeCurveKey = easeCurveKeys[easeIndex];
            // Interpolate object's rotation and scale.
            cube.animateTo(
                { transform: { local: { rotation, scale } } },
                1.0, (MRE.AnimationEaseCurves as any)[easeCurveKey]);
            await delay(1000);
        }

        return true;
    }
}
