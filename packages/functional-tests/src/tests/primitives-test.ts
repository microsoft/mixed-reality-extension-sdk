/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRESDK from '@microsoft/mixed-reality-extension-sdk';
import { Actor } from '@microsoft/mixed-reality-extension-sdk';
import App from '../app';
import delay from '../utils/delay';
import destroyActors from '../utils/destroyActors';
import Test from './test';

export default class PrimitivesTest extends Test {

    constructor(app: App, private baseUrl: string) {
        super(app);
    }

    public async run(): Promise<boolean> {
        let success = true;

        success = success && await this.runPrimitivesTest();

        return success;
    }

    public async runPrimitivesTest(): Promise<boolean> {
        // Make a root object.
        const tester = MRESDK.Actor.CreateEmpty(this.app.context, {});

        for (let x = 0.1; x < 0.35; x += 0.1) {
            for (let y = 0.1; y < 0.35; y += 0.1) {
                for (let z = 0.1; z < 0.35; z += 0.1) {
                    MRESDK.Actor.CreatePrimitive(this.app.context, {
                        definition: {
                            shape: MRESDK.PrimitiveShape.Box,
                            dimensions: { x, y, z }
                        },
                        addCollider: true,
                        actor: {
                            parentId: tester.value.id,
                            transform: {
                                position: { x: x * 4, y: y * 4, z: z * 4 }
                            }
                        }
                    });

                }
            }
        }

        // Wait a bit.
        await delay(4 * 1000);

        // Destroy the actors we created.
        destroyActors(tester.value);

        return true;
    }
}
