/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class PhysicsSimTest extends Test {
    public expectedResultDescription = "Balls trickle through the plinko board";
    private interval: NodeJS.Timeout;
    private pegMat: MRE.Material;
    private ballMat: MRE.Material;

    public async run(): Promise<boolean> {
        this.pegMat = this.app.context.assetManager.createMaterial('peg', {
            color: MRE.Color3.FromInts(79, 36, 6)
        }).value;
        this.ballMat = this.app.context.assetManager.createMaterial('ball', {
            color: MRE.Color3.FromInts(220, 150, 150)
        }).value;

        await this.createPegField(2, 2);
        this.interval = setInterval(() => this.spawnBall(1.5, 1.3), 1000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }

    private async createPegField(
        width: number, height: number,
        pegRadius = 0.02, spacing = 0.2, verticalDistort = 1.1
    ) {

        const finalPosition = new MRE.Vector3(width / 2, height / 2, -0.2);
        const position = new MRE.Vector3(-width / 2, -height / 2, -0.2);
        let oddRow = 0;

        while (position.x <= finalPosition.x && position.y <= finalPosition.y) {
            MRE.Actor.CreatePrimitive(this.app.context, {
                definition: {
                    shape: MRE.PrimitiveShape.Cylinder,
                    dimensions: { x: 0, y: 0, z: 0.2 },
                    radius: pegRadius
                },
                addCollider: true,
                actor: {
                    transform: { position },
                    appearance: { materialId: this.pegMat.id }
                }
            });

            position.x += spacing;
            if (position.x > finalPosition.x) {
                position.y += verticalDistort * spacing;
                oddRow = 1 - oddRow;

                position.x = -width / 2 + oddRow * spacing / 2;
            }
        }
    }

    private spawnBall(width: number, height: number, ballRadius = 0.07, killTimeout = 5000) {
        const ball = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: ballRadius
            },
            addCollider: true,
            actor: {
                appearance: { materialId: this.ballMat.id },
                transform: {
                    position: { x: -width / 2 + width * Math.random(), y: height, z: -0.2 }
                },
                rigidBody: {
                    mass: 3,
                    constraints: [MRE.RigidBodyConstraints.FreezePositionZ]
                }
            }
        }).value;

        setTimeout(() => {
            ball.destroy();
        }, killTimeout);
    }
}
