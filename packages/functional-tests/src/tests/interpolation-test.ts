/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class InterpolationTest extends Test {
    public expectedResultDescription = "Lerping scale and rotation";
    public async run(): Promise<boolean> {
        const cube = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 0.65, y: 0.65, z: 0.65 }
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
            // Random scale in [0.5..1.5].
            const scalar = 0.3 + 0.7 * Math.random();
            const scale = new MRE.Vector3(scalar, scalar, scalar);
            // Random ease curve.
            const easeCurveKeys = Object.keys(MRE.AnimationEaseCurves);
            const easeIndex = Math.floor(Math.random() * easeCurveKeys.length);
            const easeCurveKey = easeCurveKeys[easeIndex];
            // Interpolate object's rotation and scale.
            await cube.animateTo(
                { transform: { rotation, scale } },
                1.0, (MRE.AnimationEaseCurves as any)[easeCurveKey]);
        }

        return true;
    }
}
