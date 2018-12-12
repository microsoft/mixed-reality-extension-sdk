/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Test } from '.';
import * as GltfGen from '..';

/** @hidden */
export default class PrimDupeTest implements Test {
    public name = 'Instanced prims';
    public shouldPrintBuffer = false;
    public shouldPrintJson = true;

    public async run(): Promise<Buffer> {
        const prim1 = new GltfGen.MeshPrimitive({
            vertices: [
                new GltfGen.Vertex({ position: [0, 0, 0] }),
                new GltfGen.Vertex({ position: [1, 0, 0] }),
                new GltfGen.Vertex({ position: [0, 1, 0] })
            ],
            triangles: [0, 1, 2],
            material: new GltfGen.Material({ name: 'red' })
        });

        const prim2 = new GltfGen.MeshPrimitive({
            material: new GltfGen.Material({ name: 'blue' })
        }, prim1);

        const factory = new GltfGen.GltfFactory(
            [new GltfGen.Scene({
                nodes: [
                    new GltfGen.Node({
                        mesh: new GltfGen.Mesh({
                            primitives: [prim1]
                        })
                    }),
                    new GltfGen.Node({
                        mesh: new GltfGen.Mesh({
                            primitives: [prim2]
                        })
                    })
                ]
            })]
        );

        return await factory.generateGLTF();
    }
}
