/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class InterpolationTest extends Test {
    private actors: MRESDK.Actor[] = [];
    private anims: Function[] = [];
    private stepSize = 0.3;
    private curveNames = Object.keys(MRESDK.AnimationEaseCurves);

    private get width() { return this.curveNames.length * this.stepSize; }

    constructor(app: App) {
        super(app);
    }

    public async run(): Promise<boolean> {
        this.buildPositionTest();
        this.buildRotationTest();
        this.buildScaleTest();
        await delay(500);
        this.anims.forEach(anim => anim());
        await delay(30000);
        destroyActors(this.actors);
        return true;
    }

    public buildPositionTest() {
        // Spawn a line of spheres. One for each ease curve type.
        let x = -this.width / 2;
        const radius = 0.09;
        for (const curveName of this.curveNames) {
            const loadActor = MRESDK.Actor.CreatePrimitive(this.app.context, {
                definition: {
                    shape: MRESDK.PrimitiveShape.Sphere,
                    radius
                },
                actor: {
                    name: `position-${x}`,
                    transform: { position: { x, y: radius, z: -this.width / 2 } }
                },
            });
            const actor = loadActor.value;
            this.actors.push(actor);

            this.anims.push(this.buildPositionInterpolation(actor,
                (MRESDK.AnimationEaseCurves as any)[curveName]));

            x += this.stepSize;
        }
    }

    public buildRotationTest() {
        // Spawn a line of spheres. One for each ease curve type.
        let x = -this.width / 2;
        const height = 1;
        for (const curveName of this.curveNames) {
            const loadActor = MRESDK.Actor.CreatePrimitive(this.app.context, {
                definition: {
                    shape: MRESDK.PrimitiveShape.Box,
                    dimensions: {
                        x: this.stepSize * 0.7,
                        y: height,
                        z: 0.05
                    }
                },
                actor: {
                    name: `rotation-${x}`,
                    transform: { position: { x, y: height / 2, z: 0 } }
                },
            });
            const actor = loadActor.value;
            this.actors.push(actor);

            this.anims.push(this.buildRotationInterpolation(actor, (MRESDK.AnimationEaseCurves as any)[curveName]));

            x += this.stepSize;
        }
    }

    public buildScaleTest() {
        // Spawn a line of spheres. One for each ease curve type.
        let x = -this.width / 2;
        const height = 1;
        for (const curveName of this.curveNames) {
            const loadActor = MRESDK.Actor.CreatePrimitive(this.app.context, {
                definition: {
                    shape: MRESDK.PrimitiveShape.Box,
                    dimensions: {
                        x: 0.1,
                        y: height,
                        z: 0.1
                    }
                },
                actor: {
                    name: `scale-${x}`,
                    transform: { position: { x, y: height / 2, z: this.width / 2 } }
                },
            });
            const actor = loadActor.value;
            this.actors.push(actor);

            // Create a chain of `animateTo` calls to move the sphere up and down on the given ease curve.
            this.anims.push(this.buildScaleInterpolation(actor, (MRESDK.AnimationEaseCurves as any)[curveName]));

            x += this.stepSize;
        }
    }

    private buildPositionInterpolation(actor: MRESDK.Actor, curve: number[]) {
        const y = actor.transform.position.y;
        const moveUp = () => actor.animateTo({
            transform: { position: { y: this.width / 3 } } }, 1.0, curve);
        const moveDown = () => actor.animateTo({
            transform: { position: { y } } }, 1.0, curve);
        const repeat = async () => {
            await moveUp();
            await delay(100);
            await moveDown();
            await delay(100);
            await repeat();
        };
        return repeat;
    }

    private buildRotationInterpolation(actor: MRESDK.Actor, curve: number[]) {
        const rotateRight = () => actor.animateTo({
            transform: {
                rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 180 * MRESDK.DegreesToRadians)
            }
        }, 1.0, curve);
        const rotateLeft = () => actor.animateTo({
            transform: {
                rotation: MRESDK.Quaternion.RotationAxis(MRESDK.Vector3.Up(), 0)
            }
        }, 1.0, curve);
        const repeat = async () => {
            await rotateRight();
            await delay(100);
            await rotateLeft();
            await delay(100);
            await repeat();
        };
        return repeat;
    }

    private buildScaleInterpolation(actor: MRESDK.Actor, curve: number[]) {
        const scaleUp = () => actor.animateTo({
            transform: { scale: { y: this.width / 3 } } }, 1.0, curve);
        const scaleDown = () => actor.animateTo({
            transform: { scale: { y: 1 } } }, 1.0, curve);
        const repeat = async () => {
            await scaleUp();
            await delay(100);
            await scaleDown();
            await delay(100);
            await repeat();
        };
        return repeat;
    }
}
