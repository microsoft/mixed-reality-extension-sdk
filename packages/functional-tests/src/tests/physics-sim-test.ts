/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

const defaultPegColor = MRE.Color3.FromInts(79, 36, 6);
const defaultBallColor = MRE.Color3.FromInts(220, 150, 150);
const collisionPegColor = MRE.Color3.FromInts(0, 252, 75);

export default class PhysicsSimTest extends Test {
    public expectedResultDescription = "Balls trickle through the plinko board";
    private interval: NodeJS.Timeout;
    private pegMat: MRE.Material;
    private ballMat: MRE.Material;
    private collRefCount = 0;
    private ballCount = 0;
    private counterPlane: MRE.Actor;

    public async run(root: MRE.Actor): Promise<boolean> {
        this.pegMat = this.app.context.assetManager.createMaterial('peg', {
            color: defaultPegColor
        }).value;
        this.ballMat = this.app.context.assetManager.createMaterial('ball', {
            color: defaultBallColor
        }).value;

        await this.createCounterPlane(root, 2, 1.25);

        await this.createPegField(root, 2, 1);
        this.interval = setInterval(() => this.spawnBall(root, 1.5, 1.5), 1000);

        await this.stoppedAsync();
        return true;
    }

    public cleanup() {
        clearInterval(this.interval);
    }

    private async createCounterPlane(root: MRE.Actor, width: number, height: number) {
        // Create the ball count text objects
        this.counterPlane = MRE.Actor.CreateEmpty(this.app.context, {
            actor: {
                parentId: root.id,
                transform: {
                    app: { position: { x: -width / 2, y: height + 0.2, z: 0.1 } }
                },
                text: {
                    contents: `Ball count: ${this.ballCount}`,
                    anchor: MRE.TextAnchorLocation.MiddleLeft,
                    height: .2
                }
            }
        }).value;

        // Create the trigger plane for the ball counter.
        MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Plane,
                dimensions: { x: width, y: 0, z: 2 }
            },
            addCollider: true,
            actor: {
                parentId: root.id,
                transform: {
                    local: { position: { x: 0, y: height, z: 0 } }
                },
                appearance: { enabled: false },
            }
        }).then(actor => {
            actor.collider.isTrigger = true;
            actor.collider.onTrigger('trigger-enter', _ => {
                ++this.ballCount;
                this.counterPlane.text.contents = `Ball count: ${this.ballCount}`;
            });
        }).catch();
    }

    private async createPegField(
        root: MRE.Actor,
        width: number, height: number,
        pegRadius = 0.02, spacing = 0.2, verticalDistort = 1.1
    ) {

        const finalPosition = new MRE.Vector3(width / 2, height, -0.07);
        const position = new MRE.Vector3(-width / 2, 0.25, -0.07);
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
                    parentId: root.id,
                    transform: { local: { position } },
                    appearance: { materialId: this.pegMat.id }
                }
            }).then(actor => {
                if (actor.collider) {
                    actor.collider.onCollision('collision-enter', data => {
                        ++this.collRefCount;
                        if (this.collRefCount === 1) {
                            actor.appearance.material.color.set(
                                collisionPegColor.r,
                                collisionPegColor.g,
                                collisionPegColor.b,
                                actor.appearance.material.color.a);
                        }
                    });

                    actor.collider.onCollision('collision-exit', data => {
                        --this.collRefCount;
                        if (this.collRefCount === 0) {
                            actor.appearance.material.color.set(
                                defaultPegColor.r,
                                defaultPegColor.g,
                                defaultPegColor.b,
                                actor.appearance.material.color.a);
                        }
                    });
                }
            }).catch();

            position.x += spacing;
            if (position.x > finalPosition.x) {
                position.y += verticalDistort * spacing;
                oddRow = 1 - oddRow;

                position.x = -width / 2 + oddRow * spacing / 2;
            }
        }
    }

    private spawnBall(root: MRE.Actor, width: number, height: number, ballRadius = 0.07, killTimeout = 5000) {
        const ball = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: ballRadius
            },
            addCollider: true,
            actor: {
                parentId: root.id,
                appearance: { materialId: this.ballMat.id },
                transform: {
                    local: { position: { x: -width / 2 + width * Math.random(), y: height, z: -0.1 } }
                },
                rigidBody: {
                    mass: 3,
                    constraints: [MRE.RigidBodyConstraints.FreezePositionZ]
                }
            }
        }).value;

        setTimeout(() => {
            // We need to disable rendering and move the ball before destroying it so that if it is currently
            // colliding with a peg, it will exit collision first for the ref counting to work properly.  Then
            // we can destroy it after another second to process the move on the client.
            ball.appearance.enabled = false;
            ball.transform.app.position = new MRE.Vector3(0, -10, 0);
            setTimeout(() => ball.destroy(), 1000);
        }, killTimeout);
    }
}
