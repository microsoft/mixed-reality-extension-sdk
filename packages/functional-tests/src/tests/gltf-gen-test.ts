/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolve } from 'path';

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import Server from '../server';
import { Test } from '../test';

export default class GltfGenTest extends Test {
    public expectedResultDescription = "A textured sphere";

    public async run(root: MRE.Actor): Promise<boolean> {
        const spherePrim = new GltfGen.Sphere(0.5);
        spherePrim.material = new GltfGen.Material({
            baseColorFactor: new MRE.Color4(1, 1, 1, 0.7),
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    embeddedFilePath: resolve(__dirname, '../../public/uv-grid.png')
                    // uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
                })
            }),
            alphaMode: GltfGen.AlphaMode.Blend
        });
        const gltfFactory = new GltfGen.GltfFactory([new GltfGen.Scene({
            nodes: [new GltfGen.Node({
                mesh: new GltfGen.Mesh({
                    primitives: [spherePrim]
                })
            })]
        })]);

        MRE.Actor.CreateFromGltf(this.app.context, {
            resourceUrl: Server.registerStaticBuffer('sphere.glb', gltfFactory.generateGLTF()),
            actor: {
                parentId: root.id,
                transform: {
                    local: {
                        position: { y: 1, z: -1 }
                    }
                }
            }
        });

        await this.stoppedAsync();

        return true;
    }
}
