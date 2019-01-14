/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { resolve } from 'path';

import * as GltfGen from '@microsoft/gltf-gen';
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from '../app';
import Server from '../server';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class GltfGenTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        const spherePrim = new GltfGen.Sphere(0.5);
        spherePrim.material = new GltfGen.Material({
            baseColorTexture: new GltfGen.Texture({
                source: new GltfGen.Image({
                    embeddedFilePath: resolve(__dirname, '../../public/uv-grid.png')
                    // uri: `${this.baseUrl}/uv-grid.png` // alternate form (don't embed)
                })
            })
        });
        const gltfFactory = new GltfGen.GltfFactory([new GltfGen.Scene({
            nodes: [new GltfGen.Node({
                mesh: new GltfGen.Mesh({
                    primitives: [spherePrim]
                })
            })]
        })]);

        const sphere = await MRE.Actor.CreateFromGLTF(this.app.context, {
            resourceUrl: Server.registerStaticBuffer('sphere.glb', gltfFactory.generateGLTF())
        });

        await delay(30000);

        destroyActors(sphere);

        return true;
    }
}
