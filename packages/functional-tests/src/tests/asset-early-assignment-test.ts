/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';

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
            color: MRESDK.Color3.Blue(),
            mainTextureId: tex.id
        }).value;

        const sphere = MRESDK.Actor.CreatePrimitive(this.app.context, {
            definition: {
                shape: MRESDK.PrimitiveShape.Sphere,
                radius: 1
            },
            actor: {
                materialId: mat.id,
                transform: {
                    position: { x: 0, y: 1, z: 0 }
                }
            }
        }).value;

        await this.stoppedAsync();
        return true;
    }
}
