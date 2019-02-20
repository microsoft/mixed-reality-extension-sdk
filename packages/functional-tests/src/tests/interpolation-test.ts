/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import { Test } from '../test';

export default class InterpolationTest extends Test {
    private sceneRoot: MRESDK.Actor;
    private running = true;

    public async run(): Promise<boolean> {
        this.sceneRoot = MRESDK.Actor.CreateEmpty(this.app.context).value;
        const expressiveCubePromise = this.spawnExpressiveCube();
        const timeout = setTimeout(() => this.running = false, 60000);
        await expressiveCubePromise;
        clearTimeout(timeout);
        return true;
    }

    private async spawnExpressiveCube() {
        const label = MRESDK.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: this.sceneRoot.id,
                transform: {
                    position: { y: 2.5 }
                },
                text: {
                    contents:
                        'Lerping scale and rotation\n' +
                        'Click to exit (or wait a minute)',
                    anchor: MRESDK.TextAnchorLocation.TopCenter,
                    justify: MRESDK.TextJustify.Center,
                    height: 0.4,
                    color: MRESDK.Color3.Yellow()
                }
            }
        }).value;
        label.setBehavior(MRESDK.ButtonBehavior).onClick('released', () => this.running = false);

        const cube = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Box
            },
            addCollider: true,
            actor: {
                parentId: this.sceneRoot.id,
            }
        }).value;
        cube.setBehavior(MRESDK.ButtonBehavior).onClick('released', () => this.running = false);

        while (this.running) {
            // Random point on unit sphere (pick random axis).
            const θ = Math.random() * 2 * Math.PI;
            const z = Math.cos(θ);
            const x = Math.sqrt(1 - z * z) * Math.cos(θ);
            const y = Math.sqrt(1 - z * z) * Math.sin(θ);
            const axis = new MRESDK.Vector3(x, y, z);
            // Random rotation around picked axis.
            const rotation = MRESDK.Quaternion.RotationAxis(axis, Math.random() * 2 * Math.PI);
            // Random scale in [1..2].
            const scalar = 1 + 1 * Math.random();
            const scale = new MRESDK.Vector3(scalar, scalar, scalar);
            // Random ease curve.
            const easeCurveKeys = Object.keys(MRESDK.AnimationEaseCurves);
            const easeIndex = Math.floor(Math.random() * easeCurveKeys.length);
            const easeCurveKey = easeCurveKeys[easeIndex];
            // Interpolate object's rotation and scale.
            await cube.animateTo(
                { transform: { rotation, scale } },
                1.0, (MRESDK.AnimationEaseCurves as any)[easeCurveKey]);
        }
    }
}
