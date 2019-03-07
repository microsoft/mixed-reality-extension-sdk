/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { Test } from '../test';

export default class AssetEarlyAssignmentTest extends Test {
    public expectedResultDescription = "Assign asset properties before initialization is finished";

    public async run(): Promise<boolean> {
        const AM = this.app.context.assetManager;
        this.app.setOverrideText("Colored & textured sphere");

        const tex = AM.createTexture('uvgrid', {
            uri: `${this.baseUrl}/uv-grid.png`
        }).value;

        const mat = AM.createMaterial('blue', {
            color: MRE.Color3.Blue(),
            mainTextureId: tex.id
        }).value;

        MRE.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRE.PrimitiveShape.Sphere,
                radius: 0.5
            },
            actor: {
                materialId: mat.id,
                transform: {
                    position: { y: 1, z: -1 }
                }
            }
        });

        await this.stoppedAsync();
        return true;
    }
}
