/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Test } from '../test';

export default class TransformTest extends Test {
    public expectedResultDescription = "Four half-meter cubes in a row";
    public async run(root: MRE.Actor): Promise<boolean> {
        const deg45 = MRE.Quaternion.FromEulerAngles(0, 0, -Math.PI / 4);

        const cube1 = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 1, y: 1, z: 1 }
            },
            actor: {
                name: 'cube1',
                parentId: root.id,
                transform: {
                    local: {
                        position: { x: -0.75 * Math.SQRT2, y: 1 },
                        rotation: deg45,
                        scale: { x: 0.5, y: 0.5, z: 0.5 }
                    }
                }
            }
        }).value;

        const cube2actor = {
            name: 'cube2',
            parentId: cube1.id,
            transform: {
                local: {
                    position: { x: 1, y: 1 },
                    rotation: deg45,
                    scale: { x: 5, y: 5, z: 5 }
                }
            }
        } as Partial<MRE.ActorLike>;

        // note: the altspace kit cube is 20cm to a side, and the testbed cube matches
        const cube2 = await MRE.Actor.CreateFromLibrary(this.app.context, {
            resourceId: 'artifact:989569229617365197',
            actor: cube2actor
        }).catch(() => MRE.Actor.CreateFromLibrary(this.app.context, {
            resourceId: 'cube_20cm',
            actor: cube2actor
        })).catch(() => cube1);

        const cube3 = MRE.Actor.CreateFromGltf(this.app.context, {
            resourceUrl: `${this.baseUrl}/cube_4m.glb`,
            actor: {
                name: 'cube3',
                parentId: cube2.id,
                transform: {
                    local: {
                        position: { x: 0, y: 0.2 * Math.SQRT2 },
                        rotation: deg45,
                        scale: { x: 0.05, y: 0.05, z: 0.05 }
                    }
                }
            }
        }).value;

        const cube4 = MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Box,
                dimensions: { x: 8, y: 8, z: 8 }
            },
            actor: {
                name: 'cube4',
                parentId: cube3.id,
                transform: {
                    local: {
                        position: { x: -4, y: 4 },
                        rotation: deg45,
                        scale: { x: 0.5, y: 0.5, z: 0.5 }
                    }
                }
            }
        }).value;

        await this.stoppedAsync();
        return true;
    }
}
